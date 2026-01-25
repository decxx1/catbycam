export interface CartItem {
	id: number;
	title: string;
	price: number;
	image: string;
	quantity: number;
	category: string;
}

import { persistentMap } from '@nanostores/persistent';
import { computed } from 'nanostores';

export const cartItems = persistentMap<Record<string, string>>('cart:', {});

export function addItem(item: Omit<CartItem, 'quantity'>) {
	const existing = cartItems.get()[item.id.toString()];
	if (existing) {
		const parsed = JSON.parse(existing) as CartItem;
		cartItems.setKey(
			item.id.toString(),
			JSON.stringify({ ...parsed, quantity: parsed.quantity + 1 }),
		);
	} else {
		cartItems.setKey(
			item.id.toString(),
			JSON.stringify({ ...item, quantity: 1 }),
		);
	}
}

export function removeItem(itemId: number) {
	cartItems.setKey(itemId.toString(), undefined);
}

export function updateQuantity(itemId: number, quantity: number) {
	const existing = cartItems.get()[itemId.toString()];
	if (existing) {
		const parsed = JSON.parse(existing) as CartItem;
		if (quantity <= 0) {
			removeItem(itemId);
		} else {
			cartItems.setKey(
				itemId.toString(),
				JSON.stringify({ ...parsed, quantity }),
			);
		}
	}
}

export function clearCart() {
	cartItems.set({});
}

export const cartList = computed(cartItems, (items) => {
	return Object.values(items).map((item) => JSON.parse(item) as CartItem);
});

export const cartTotal = computed(cartList, (list) => {
	return list.reduce((total, item) => total + item.price * item.quantity, 0);
});

export const cartCount = computed(cartList, (list) => {
	return list.reduce((count, item) => count + item.quantity, 0);
});
