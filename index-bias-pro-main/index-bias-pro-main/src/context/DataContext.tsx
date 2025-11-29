import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BhavCopyRow, IndexName } from '@/types/options';

interface DataContextType {
    rawData: BhavCopyRow[];
    setRawData: (data: BhavCopyRow[]) => void;
    spotPrices: Record<string, number>;
    setSpotPrice: (index: string, price: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [rawData, setRawData] = useState<BhavCopyRow[]>([]);
    const [spotPrices, setSpotPrices] = useState<Record<string, number>>({
        'NIFTY': 22000,
        'BANKNIFTY': 46000,
        'FINNIFTY': 20500,
        'MIDCPNIFTY': 10800,
        'SENSEX': 73000,
    });

    const setSpotPrice = (index: string, price: number) => {
        setSpotPrices(prev => ({
            ...prev,
            [index]: price
        }));
    };

    return (
        <DataContext.Provider value={{ rawData, setRawData, spotPrices, setSpotPrice }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
