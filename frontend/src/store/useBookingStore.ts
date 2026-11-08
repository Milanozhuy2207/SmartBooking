import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import axiosClient from '../api/axiosClient';

export interface Room {
    _id: string;
    room_number: string;
    name?: string;
    type: 'STANDARD' | 'DELUXE' | 'VIP';
    price_per_night: number;
    image_url?: string;
    description?: string;
    area?: string;
    bed_type?: string;
    max_guests?: number;
    view?: string;
    is_locked: boolean;
    locked_by_user: string | null;
    locked_until: string | null;
}

export interface Hotel {
    _id: string;
    name: string;
    location: string;
    star_rating: number;
    image_url: string;
    description: string;
    rooms?: Room[];
}

interface BookingStore {
    hotels: Hotel[];
    rooms: Room[];
    locations: any[];
    isLoading: boolean;
    fetchHotels: (location?: string) => Promise<void>;
    fetchRoomsByHotel: (hotelId: string, checkIn?: string, checkOut?: string) => Promise<void>;
    fetchLocations: () => Promise<void>;
    lockRoom: (roomId: string, checkIn: string, checkOut: string) => Promise<boolean>;
    confirmBookingDone: (roomId: string) => void;
    initSocketListeners: () => void;
}

const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
        : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));

const socket: Socket = io(SOCKET_BASE_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling']
});

export const useBookingStore = create<BookingStore>((set) => ({
    hotels: [],
    rooms: [],
    locations: [],
    isLoading: false,

    fetchHotels: async (location?: string) => {
        set({ isLoading: true });
        try {
            const res = await axiosClient.get('/hotels', { params: { location } });
            const dataList = Array.isArray(res.data?.data) ? res.data.data : [];
            set({ hotels: dataList, isLoading: false });
        } catch (error) {
            console.error('Error fetching hotels:', error);
            set({ hotels: [], isLoading: false });
        }
    },

    fetchLocations: async () => {
        set({ isLoading: true });
        try {
            const response = await axiosClient.get('/hotels/locations');
            const dataList = Array.isArray(response.data?.data) ? response.data.data : [];
            set({ locations: dataList, isLoading: false });
        } catch (error) {
            console.error('Error fetching locations:', error);
            set({ locations: [], isLoading: false });
        }
    },

    fetchRoomsByHotel: async (hotelId: string, checkIn?: string, checkOut?: string) => {
        set({ isLoading: true });
        try {
            const res = await axiosClient.get(`/hotels/${hotelId}/rooms`, { params: { check_in: checkIn, check_out: checkOut } });
            const dataList = Array.isArray(res.data?.data) ? res.data.data : [];
            set({ rooms: dataList, isLoading: false });
        } catch (error) {
            console.error('Error fetching rooms:', error);
            set({ rooms: [], isLoading: false });
        }
    },

    lockRoom: (roomId: string, checkIn: string, checkOut: string) => {
        return new Promise<boolean>((resolve) => {
            socket.emit('request_lock_room', { roomId, checkIn, checkOut });
            socket.once('lock_room_response', (res: { success: boolean, message?: string }) => {
                resolve(!!res.success);
            });
        });
    },

    confirmBookingDone: (roomId: string) => {
        socket.emit('booking_done', { roomId });
    },

    initSocketListeners: () => {
        socket.on('room_locked_broadcast', (data: { roomId: string, lockedUntil: string }) => {
            set((state) => ({
                rooms: state.rooms.map((r) => r._id === data.roomId ? { ...r, is_locked: true, locked_until: data.lockedUntil } : r)
            }));
        });

        socket.on('room_unlocked_broadcast', (data: { roomId: string }) => {
            set((state) => ({
                rooms: state.rooms.map((r) => r._id === data.roomId ? { ...r, is_locked: false, locked_by_user: null, locked_until: null } : r)
            }));
        });
    }
}));
