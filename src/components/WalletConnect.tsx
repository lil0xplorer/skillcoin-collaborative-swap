import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, LogOut, RefreshCw } from 'lucide-react';

interface WalletConnectProps {
  onConnect: (address: string, balance: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  connectedAddress?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ 
  onConnect, 
  onDisconnect, 
  isConnected, 
  connectedAddress 
}) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedWallet = localStorage.getItem('walletAddress');
    if (savedWallet && window.ethereum) {
      reconnectWallet();
    }
  }, []);

  const reconnectWallet = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const address = accounts[0].address;
        const balance = await provider.getBalance(address);
        const formattedBalance = ethers.formatEther(balance);
        onConnect(address, formattedBalance);
      }
    } catch (err) {
      console.error('Failed to reconnect wallet:', err);
      localStorage.removeItem('walletAddress');
    }
  };

  const connectWallet = async () => {
    try {
      setConnecting(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      
      const formattedBalance = ethers.formatEther(balance);
      
      localStorage.setItem('walletAddress', address);
      
      onConnect(address, formattedBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      localStorage.removeItem('walletAddress');
    } finally {
      setConnecting(false);
    }
  };

  const resetAllData = () => {
    if (window.confirm('This will reset all your data. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem('walletAddress');
    onDisconnect();
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={resetAllData}
          className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          title="Reset all data"
        >
          <RefreshCw size={20} />
          Reset
        </button>
        <button
          onClick={disconnectWallet}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
        >
          <LogOut size={20} />
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={connectWallet}
        disabled={connecting}
        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
      >
        <Wallet size={20} />
        {connecting ? 'Connecting...' : 'Connect MetaMask'}
      </button>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default WalletConnect;