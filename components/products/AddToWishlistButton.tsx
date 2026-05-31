'use client';

import { Button } from '@/components/ui/button';
import { useWishlistQuery, useAddToWishlist, useRemoveFromWishlist, useGuestWishlist } from '@/hooks/useWishlistQueries';
import { Heart } from 'lucide-react';
import { useAuth } from '@/auth';
import { useRouter } from 'next/navigation';

interface AddToWishlistButtonProps {
  productId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function AddToWishlistButton({ 
  productId, 
  className = '',
  variant = 'outline',
  size = 'default'
}: AddToWishlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Authenticated
  const { data: wishlistData } = useWishlistQuery();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  
  // Guest
  const guestWishlist = useGuestWishlist();

  const isInWishlistLocal = isAuthenticated
    ? (wishlistData?.wishlist ?? []).some(item => item.productId === productId)
    : guestWishlist.isInWishlist(productId);

  const isUpdating = isAuthenticated
    ? addToWishlistMutation.isPending || removeFromWishlistMutation.isPending
    : guestWishlist.updating === productId;

  const handleWishlistToggle = async () => {
    if (isInWishlistLocal) {
      if (isAuthenticated) {
        removeFromWishlistMutation.mutate(productId);
      } else {
        guestWishlist.removeFromWishlist(productId);
      }
    } else {
      if (isAuthenticated) {
        addToWishlistMutation.mutate(productId);
      } else {
        await guestWishlist.addToWishlist(productId);
      }
    }
  };

  return (
    <Button
      onClick={handleWishlistToggle}
      disabled={isUpdating}
      variant={isInWishlistLocal ? 'default' : variant}
      size={size}
      className={className}
    >
      {isUpdating ? (
        'Updating...'
      ) : (
        <>
          <Heart 
            className={`w-4 h-4 ${isInWishlistLocal ? 'fill-current' : ''}`}
            fill={isInWishlistLocal ? 'currentColor' : 'none'}
          />
          <span className="ml-2">
            {isInWishlistLocal ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </span>
        </>
      )}
    </Button>
  );
}