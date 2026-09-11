import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import axiosClient from '../api/axiosClient';

export interface Room {
    _id: string;
    room_number: string;
    type: 'STANDARD' | 'DELUXE' | 'VIP';
    price_per_night: number;
    is_locked: boolean;
    locked_by_user: string | null;
    locked_until: string | null;
}

export interface Hotel {
    _id: string;
    name: string;
    location: any[];
    star_rating: number;
    image_url: string;
    description: string;
}

interface BookingStore {
    hotels: Hotel[];
    rooms: Room[];
    locations: any[];
    isLoading: boolean;
    fetchHotels: (location?: string) => Promise<void>;
    fetchRoomsByHotel: (hotelId: string) => Promise<void>;
    fetchLocations: () => Promise<void>;
    lockRoom: (roomId: string) => void;
    initSocketListeners: () => void;
}

const socket: Socket = io('http://localhost:3000');

export const useBookingStore = create<BookingStore>((set) => ({
    hotels: [],
    rooms: [],
    locations: [],
    isLoading: false,

    fetchHotels: async (location?: string) => {
        set({ isLoading: true });
        try {
            const res = await axiosClient.get('/hotels', { params: { location } });
            set({ hotels: res.data.data, isLoading: false });
        } catch (error) {
            console.error('Error fetching hotels:', error);
            set({ isLoading: false });
        }
    },

    fetchLocations: async () => {
        set({ isLoading: true })
        try {
            const response = await axiosClient.get('/hotels/locations')
            set({ locations: response.data.data, isLoading: false })
        } catch (error) {
            console.error('Error fetching locations:', error)
            set({ isLoading: false })
        }
    },

    fetchRoomsByHotel: async (hotelId: string) => {
        set({ isLoading: true });
        try {
            const res = await axiosClient.get(`/hotels/${hotelId}/rooms`);
            set({ rooms: res.data.data, isLoading: false });
        } catch (error) {
            console.error('Error fetching rooms:', error);
            set({ isLoading: false });
        }
    },

    lockRoom: (roomId: string) => {
        socket.emit('request_lock_room', roomId);
        socket.once('lock_room_response', (res: { success: boolean, message?: string }) => {
            if (!res.success) alert('Fail to lock room: ' + res.message);
        });
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