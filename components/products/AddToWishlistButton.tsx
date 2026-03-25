'use client';

import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/lib/stores';
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
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist, updating } = useWishlistStore();

  const isInWishlistLocal = isInWishlist(productId);
  const isUpdating = updating === productId;

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isInWishlistLocal) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
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