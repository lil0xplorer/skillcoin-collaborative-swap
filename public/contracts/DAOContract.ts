import { ethers } from 'ethers';

export const DAO_CONTRACT_ADDRESS = '0x702160806DE650831eDc2731e128f17feE1E897e';
export const DAO_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      }
    ],
    "name": "createProposal",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      }
    ],
    "name": "executeProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      }
    ],
    "name": "getProposal",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "startTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesVotes",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noVotes",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "executed",
            "type": "bool"
          }
        ],
        "internalType": "struct DAO.ProposalInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "getVotingPower",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "support",
        "type": "bool"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export class DAOContract {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.contract = new ethers.Contract(DAO_CONTRACT_ADDRESS, DAO_ABI, signer);
  }

  async createProposal(title: string, description: string, durationInDays: number) {
    const endTime = Math.floor(Date.now() / 1000) + (durationInDays * 24 * 60 * 60);
    const fee = ethers.parseEther("0.01"); // 0.01 ETH fee
    
    try {
      const tx = await this.contract.createProposal(title, description, endTime, {
        value: fee
      });
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  async vote(proposalId: number, support: boolean) {
    try {
      const tx = await this.contract.vote(proposalId, support);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  }

  async executeProposal(proposalId: number) {
    try {
      const tx = await this.contract.executeProposal(proposalId);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Error executing proposal:', error);
      throw error;
    }
  }

  async getProposal(proposalId: number) {
    return this.contract.getProposal(proposalId);
  }

  async getVotingPower(address: string) {
    return this.contract.getVotingPower(address);
  }
}