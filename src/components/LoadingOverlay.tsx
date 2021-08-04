import React, { useEffect, useState } from 'react';
import { IonLoading } from '@ionic/react';
import { useEth } from '../api/Web3Api';

const LoadingOverlay: React.FC<Props> = ({ message = '' }: Props) => {
    const [isLoading, setLoading] = useState<{
        loading: boolean;
        message: string;
    }>({
        loading: false,
        message: '',
    });

    const { isWeb3Loading, error, isChangingContract } = useEth();

    useEffect(() => {
        setLoading({
            loading: !!message,
            message,
        });
    }, [message]);

    // Wait for initial web3 API loading
    useEffect(() => {
        if (isWeb3Loading) {
            setLoading({
                loading: true,
                message: 'Syncing with Ethereum...',
            });
        } else {
            setLoading({ loading: false, message: '' });
        }
    }, [isWeb3Loading]);

    useEffect(() => {
        if (typeof error !== 'undefined') {
            setLoading({ loading: false, message: '' });
        }
    }, [error]);

    // refresh if contract reloads
    useEffect(() => {
        if (isChangingContract) {
            if (!isWeb3Loading) {
                setLoading({
                    loading: true,
                    message: 'Connecting to Web3 instance with new contract...',
                });
            }
        } else {
            if (!isWeb3Loading) {
                setLoading({ loading: false, message: '' });
            }
        }

        // we disable next line to prevent change on getClaimParams
        // eslint-disable-next-line
  }, [isChangingContract]);

    return <IonLoading isOpen={isLoading.loading} message={isLoading.message} />;
};

interface Props {
    message?: string;
}

export default LoadingOverlay;
