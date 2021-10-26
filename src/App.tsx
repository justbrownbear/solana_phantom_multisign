import { useState } from "react";
import { usePhantom, UsePhantomType } from "./hooks/usePhantom";
import { CreateSecp256k1InstructionWithPrivateKeyParams, Secp256k1Program, Transaction, TransactionInstruction } from "@solana/web3.js";
import Web3 from "web3";

const ethereumWeb3 = new Web3();
const ethAccount = ethereumWeb3.eth.accounts.create();


// ***************************************************************************************************
// ***************************************************************************************************
export default function App() {
	const phantom = usePhantom();
	const [messages, setMessages] = useState<string[]>([]);
	const [submissions, setSubmissions] = useState<string[]>([]);

	if (!phantom.provider)
		return <NoPhantomDialog />;

	if (!phantom.isConnectedToPhantom)
		return <ConnectDialog phantom={phantom} />;

	const onMessageChange = (event: any, i: number) => {
		const newMessages = [...messages];
		newMessages[i] = event.target.value
		setMessages(newMessages);
	}

	const addMessage = () => setMessages([...messages, "Some message text #" + messages.length]);
	const signAndSend = () => signAndSendMessages(messages, phantom, setSubmissions);

	const isSignButtonDisabled = !messages.length;

	return (
		<div>
			{
				messages.map((message, i) =>
					<div key={i}>
						<hr />
						Message #{i + 1}: <textarea value={message} onChange={(event) => onMessageChange(event, i)}></textarea>
						<div>{submissions[i]}</div>
					</div>
				)
			}
			<div>
				<button onClick={addMessage}>Add message</button>
				-
				<button onClick={signAndSend} disabled={isSignButtonDisabled}>Sign all at once</button>
			</div>
		</div>
	);
}



// ***************************************************************************************************
// ***************************************************************************************************
async function signAndSendMessages(messages: string[], phantom: UsePhantomType, setSubmissions: (signatures: string[]) => void) {
	const transactionInstructions =
		messages.map((message) =>
			createTransactionInstruction(message, ethAccount.privateKey));

	const transactions: Transaction[] = [];

	for (let i = 0; i < transactionInstructions.length; i++) {
		// One instruction in one transaction
		const transaction = await createTransaction(transactionInstructions[i], phantom);
		transactions.push(transaction);
	}

	const signedTransactionInstructions = await phantom.provider!.signAllTransactions(transactions);
	const submissions: string[] = [];

	for (let i = 0; i < signedTransactionInstructions.length; i++) {
		const submissionId = await phantom.connection.sendRawTransaction(signedTransactionInstructions[i].serialize());
		submissions.push(submissionId);
		console.log("Submitted transaction " + submissionId + ", awaiting confirmation");
	}

	setSubmissions(submissions);
}



// ***************************************************************************************************
// ***************************************************************************************************
async function createTransaction(instruction: TransactionInstruction, phatnom: UsePhantomType) {
	const transaction = new Transaction();

	transaction.add(instruction);

	// To use with Phantom, each transaction must have feePayer and recentBlockhash fields
	transaction.feePayer = phatnom.provider!.publicKey!;
	transaction.recentBlockhash = (await phatnom.connection.getRecentBlockhash()).blockhash;

	return transaction;
}



// ***************************************************************************************************
// ***************************************************************************************************
function createTransactionInstruction(message: string, ethPrivateKey: string): TransactionInstruction {
	const payload: CreateSecp256k1InstructionWithPrivateKeyParams =
	{
		message: Buffer.from(message),
		privateKey: convertToNumberArrayBuffer(ethPrivateKey, 32),
		instructionIndex: 0
	};

	return Secp256k1Program.createInstructionWithPrivateKey(payload);
}



// ***************************************************************************************************
// ***************************************************************************************************
export function NoPhantomDialog() {
	return (
		<div>
			You haven't installed Phatnom!<br />
			Download it <a href="https://phantom.app/" target="_blank">here</a>
		</div>
	);
}



// ***************************************************************************************************
// ***************************************************************************************************
export function ConnectDialog(props: { phantom: UsePhantomType }) {
	const { phantom } = props;

	const connect = () => phantom.connectToPhantom();

	return (
		<div>
			You haven't connected to Phatnom<br />
			<button onClick={connect}>Connect to Phantom</button>
		</div>
	);
}



// ***************************************************************************************************
// ***************************************************************************************************
export function convertToNumberArrayBuffer(stringNumber: string, alignWithZeroesTo?: number): Buffer {
	if (!stringNumber.startsWith("0x"))
		throw new Error("stringNumber must start with '0x'");

	let result = stringNumber
		.substring(2)
		.match(/.{1,2}/g)!
		.map((char) => parseInt(char, 16));

	if (alignWithZeroesTo && alignWithZeroesTo > result.length) result = [...Array.from({ length: alignWithZeroesTo - result.length }, (_) => 0), ...result];

	return Buffer.from(result);
}
