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
      <div className="buttons">
        <button
          onClick={connectWallet}
          disabled={connecting}
          className="blob-btn"
        >
          <span className="blob-btn__inner">
            <span className="blob-btn__blobs">
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
              <span className="blob-btn__blob"></span>
              <span className="flex items-center justify-center gap-2">
                <Wallet size={20} />
                <span className="hidden md:inline">Connect MetaMask</span>
                <span className="md:hidden">Connect</span>
              </span>
            </span>
          </span>
        </button>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="hidden">
          <defs>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10"></feGaussianBlur>
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="goo"></feColorMatrix>
              <feBlend in2="goo" in="SourceGraphic" result="mix"></feBlend>
            </filter>
          </defs>
        </svg>
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default WalletConnect;