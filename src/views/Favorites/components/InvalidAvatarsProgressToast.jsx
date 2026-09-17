import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default {
    name: 'InvalidAvatarsProgressToast',
    props: {
        t: { type: Function, required: true },
        progress: { type: Object, required: true },
        onDismiss: { type: Function, required: true }
    },
    setup(props) {
        return () => (
            <div class="flex flex-col gap-2 pr-1">
                <div class="text-sm font-medium">
                    {props.t('view.favorite.avatars.checking_progress', {
                        current: props.progress.current,
                        total: props.progress.total
                    })}
                </div>
                <Progress modelValue={props.progress.percentage} class="h-2 w-full" />
                <div class="flex justify-end">
                    <Button size="sm" variant="secondary" onClick={props.onDismiss}>
                        {props.t('view.favorite.avatars.dismiss')}
                    </Button>
                </div>
            </div>
        );
    }
};
