'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareButtonProps {
    title: string;
    url: string;
    labels: {
        share: string;
        shareTitle: string;
        shareSuccess: string;
        linkCopied: string;
    };
}

export function ShareButton({ title, url, labels }: ShareButtonProps) {
    const handleShare = async () => {
        // Construct full URL if it's relative
        const shareUrl = typeof window !== 'undefined'
            ? (url.startsWith('http') ? url : window.location.origin + url)
            : url;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: labels.shareTitle,
                    text: title,
                    url: shareUrl,
                });
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    copyFallback(shareUrl);
                }
            }
        } else {
            copyFallback(shareUrl);
        }
    };

    const copyFallback = async (shareUrl: string) => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success(labels.shareSuccess, {
                description: labels.linkCopied,
            });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="rounded-xl h-10 px-6 font-bold border-2 hover:bg-primary hover:text-white transition-all shadow-sm"
        >
            <Share2 className="h-4 w-4 mr-2" />
            {labels.share}
        </Button>
    );
}
