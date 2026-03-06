import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { StoreItem, PlayerInventory, StoreItemType, StoreItemRarity } from '../store.types';
import { economyService } from './economy.service';
import { statsService } from './stats.service';
import { authService } from './auth.service';

const STORE_COLLECTION = 'store_catalog';

export class StoreService {

    /**
     * Get the current player's inventory
     */
    async getInventory(): Promise<PlayerInventory> {
        const stats = await statsService.getStats();
        return stats.inventory || { ownedItems: [], equipped: { avatar: 'avatar_default', skin: 'skin_default' } };
    }

    async getCatalog(): Promise<StoreItem[]> {
        try {
            const querySnapshot = await getDocs(collection(db, STORE_COLLECTION));
            const catalog: StoreItem[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                catalog.push({
                    id: doc.id,
                    name: data.name || 'Unnamed Item',
                    description: data.description || '',
                    type: data.type as StoreItemType,
                    rarity: data.rarity as StoreItemRarity,
                    priceCoins: data.priceCoins,
                    priceDiamonds: data.priceDiamonds,
                    rewards: data.rewards,
                    assetId: data.assetId || 'default_asset',
                    imageUrl: data.imageUrl,
                });
            });
            return catalog;
        } catch (error) {
            console.error("Error fetching catalog from Firestore:", error);
            return []; // Fallback to empty if network issue
        }
    }

    /**
     * Check if an item is already owned
     */
    async isItemOwned(itemId: string): Promise<boolean> {
        const inventory = await this.getInventory();
        return inventory.ownedItems.includes(itemId);
    }

    /**
     * Equip an item that the player owns
     */
    async equipItem(itemId: string, userId?: string): Promise<{ success: boolean; message?: string }> {
        const catalog = await this.getCatalog();
        const item = catalog.find(i => i.id === itemId);
        if (!item) return { success: false, message: "Item introuvable" };

        const inventory = await this.getInventory();
        if (!inventory.ownedItems.includes(itemId)) {
            return { success: false, message: "Vous ne possédez pas cet objet." };
        }

        // Apply equipment mapping
        const newInventory = JSON.parse(JSON.stringify(inventory)) as PlayerInventory;
        if (item.type === 'AVATAR') {
            newInventory.equipped.avatar = itemId;
            // Sync with global auth profile to update everywhere
            await authService.updateProfile({ photoURL: item.assetId });
        } else if (item.type === 'SKIN') {
            newInventory.equipped.skin = itemId;
        } else {
            return { success: false, message: "Cet objet ne peut pas être équipé." };
        }

        await statsService.updateInventory(newInventory, userId);
        return { success: true };
    }

    /**
     * Purchase an item (Cosmetic or Currency Pack)
     */
    async purchaseItem(itemId: string, userId?: string): Promise<{ success: boolean; message?: string }> {
        const catalog = await this.getCatalog();
        const item = catalog.find(i => i.id === itemId);
        if (!item) return { success: false, message: "Item introuvable" };

        // 1. Check if already owned for non-consumables
        if (item.type !== 'CURRENCY_PACK') {
            const isOwned = await this.isItemOwned(item.id);
            if (isOwned) {
                return { success: false, message: "Vous possédez déjà cet objet." };
            }
        }

        // 2. Check funds
        const economy = await economyService.getEconomy();

        if (item.priceCoins && economy.coins < item.priceCoins) {
            return { success: false, message: "Fonds insuffisants (Coins)." };
        }
        if (item.priceDiamonds && economy.diamonds < item.priceDiamonds) {
            return { success: false, message: "Fonds insuffisants (Diamants)." };
        }

        // 3. Deduct funds
        const updatedEconomy = { ...economy };
        if (item.priceCoins) updatedEconomy.coins -= item.priceCoins;
        if (item.priceDiamonds) updatedEconomy.diamonds -= item.priceDiamonds;

        // 4. Apply rewards and grants
        if (item.type === 'CURRENCY_PACK' && item.rewards) {
            if (item.rewards.coins) updatedEconomy.coins += item.rewards.coins;
            if (item.rewards.diamonds) updatedEconomy.diamonds += item.rewards.diamonds;
        } else {
            // Add to inventory
            const inventory = await this.getInventory();
            const newInventory = JSON.parse(JSON.stringify(inventory)) as PlayerInventory;
            newInventory.ownedItems.push(item.id);
            await statsService.updateInventory(newInventory, userId);
        }

        // 5. Save updated economy
        await economyService.setEconomy(updatedEconomy, userId);

        return { success: true };
    }
}

export const storeService = new StoreService();
