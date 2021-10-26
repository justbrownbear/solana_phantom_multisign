import { Cluster, clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useEffect, useState } from "react";

const network = clusterApiUrl("devnet");
const connection = new Connection(network);

export function usePhantom(network: Cluster = "devnet"): UsePhantomType {
	// @ts-ignore
	const [provider, setProvider] = useState<PhantomProvider | undefined>(undefined);
	const [isConnectedToPhantom, setIsConnectedToPhantom] = useState<boolean>(false);

	// const connection


	// Solana and Phantom required time to initialize
	if (!provider) {
		const timeout = setInterval(() => {
			// @ts-ignore
			if (window.solana && window.solana.isPhantom) {
				clearInterval(timeout);
				// @ts-ignore
				setProvider(window.solana);
			}
		}, 100);
	}


	useEffect(() => {
		if (provider) {
			provider.on("connect", () => setIsConnectedToPhantom(true));
			provider.on("disconnect", () => setIsConnectedToPhantom(false));

			provider.connect({ onlyIfTrusted: true });

			return () => { provider.disconnect(); };
		}
	}, [provider]);


	const connectToPhantom = async () => {
		try {
			if (!provider)
				return;

			await provider.connect();
			// @ts-ignore
			// setProvider( window.solana );
			// setConnected( true );
			Promise.resolve();
		}
		catch (error) {
			console.error(error);
			// setConnected( false );
			Promise.reject(error);
		}
	};


	return (
		{
			provider,
			connection,
			isConnectedToPhantom,
			connectToPhantom
		});
}


export interface UsePhantomType {
	provider: PhantomProvider | undefined,
	connection: Connection,
	isConnectedToPhantom: boolean,
	connectToPhantom: () => Promise<void>
}



interface PhantomProvider {
	publicKey: PublicKey | null;
	isConnected: boolean | null;
	signTransaction: (transaction: Transaction) => Promise<Transaction>;
	signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
	signMessage: (
		message: Uint8Array | string,
		display?: DisplayEncoding
	) => Promise<any>;
	connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
	disconnect: () => Promise<void>;
	on: (event: PhantomEvent, handler: (args: any) => void) => void;
	request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}


type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
	| "connect"
	| "disconnect"
	| "signTransaction"
	| "signAllTransactions"
	| "signMessage";
interface ConnectOpts {
	onlyIfTrusted: boolean;
}
