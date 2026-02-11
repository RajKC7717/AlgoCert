import { useState, useMemo, useRef, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { KeystrokeAnalyzer, HumanScore } from '../utils/keystrokeAnalyzer'
import { generateMetadata } from '../utils/nftMetadata'
import { pinJSONToIPFS, ipfsHttpUrl } from '../utils/pinata'
import { sha256 } from 'js-sha256'

const MOCK_BOUNTIES = [
    { id: '1', title: 'Build a React Counter', description: 'Create a counter with increment/decrement buttons.' },
    { id: '2', title: 'Implement Fibonacci', description: 'Write a function to calculate the nth Fibonacci number.' },
    { id: '3', title: 'Todo List Reducer', description: 'Implement a Redux-style reducer for a Todo list.' },
]

interface DevDuelProps {
    openModal: boolean
    closeModal: () => void
}

const DevDuel = ({ openModal, closeModal }: DevDuelProps) => {
    const { activeAddress, transactionSigner } = useWallet()
    const { enqueueSnackbar } = useSnackbar()

    // State
    const [selectedBountyId, setSelectedBountyId] = useState(MOCK_BOUNTIES[0].id)
    const [code, setCode] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [scoreData, setScoreData] = useState<HumanScore | null>(null)
    const [isMinting, setIsMinting] = useState(false)
    const [sessionDuration, setSessionDuration] = useState(0)
    const [startTime, setStartTime] = useState(0)

    // Refs
    const analyzerRef = useRef<KeystrokeAnalyzer>(new KeystrokeAnalyzer())
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Algorand Client
    const algorand = useMemo(() => {
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const client = AlgorandClient.fromConfig({ algodConfig })
        client.setDefaultSigner(transactionSigner)
        return client
    }, [transactionSigner])

    const selectedBounty = MOCK_BOUNTIES.find(b => b.id === selectedBountyId)

    // Start Session
    const startSession = () => {
        setCode('')
        setScoreData(null)
        setSessionDuration(0)
        analyzerRef.current.reset()
        setIsRecording(true)
        const start = Date.now()
        setStartTime(start)

        // Timer for duration updates
        timerRef.current = setInterval(() => {
            setSessionDuration((Date.now() - start) / 1000)
        }, 1000)
    }

    // End Session
    const endSession = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsRecording(false)
        setScoreData(analyzerRef.current.calculateStats())
    }

    // Handle Typing - use onChange for simplicity in capturing value, but logs need distinct events
    // Actually, we need onKeyDown for the analyzer to classify keys properly
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!isRecording) return
        // Allow analyzer to see the key event
        analyzerRef.current.logKey(e.key)
        // Real-time analysis update (every 10 chars to avoid perf hit)
        if (analyzerRef.current.getLogs().length % 10 === 0) {
            // Optional: update realtime score preview? 
            // setScoreData(analyzerRef.current.calculateStats()) 
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (!isRecording) return
        const pasteContent = e.clipboardData.getData('text')
        analyzerRef.current.logPaste(pasteContent.length)
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!isRecording) return
        setCode(e.target.value)
    }

    // Mint NFT
    const mintProof = async () => {
        if (!activeAddress || !scoreData || !selectedBounty) {
            enqueueSnackbar('Wallet not connected', { variant: 'error' })
            return
        }

        if (scoreData.score < 80) {
            enqueueSnackbar('Score too low to mint proof! Try again.', { variant: 'error' })
            return
        }

        setIsMinting(true)
        try {
            // 1. Generate Metadata
            const codeHash = sha256(code)
            // Placeholder image for now
            const placeholderImage = 'https://gateway.pinata.cloud/ipfs/QmPlaceholder'

            const metadata = generateMetadata(
                selectedBounty.id,
                selectedBounty.title,
                codeHash,
                sessionDuration,
                scoreData,
                placeholderImage
            )

            // 2. Pin to IPFS
            const jsonPin = await pinJSONToIPFS(metadata)
            const metadataUrl = `${ipfsHttpUrl(jsonPin.IpfsHash)}#arc3`
            console.log('Metadata URL:', metadataUrl)

            // 3. Calc Hash
            const hashHex = sha256(JSON.stringify(metadata))
            const metadataHash = new Uint8Array(
                hashHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
            )

            // 4. Mint Asset
            const result = await algorand.send.assetCreate({
                sender: activeAddress,
                total: 1n,
                decimals: 0,
                assetName: 'DEV-PROOF', // Max 32 chars
                unitName: `DEV${selectedBounty.id}`, // Max 8 chars
                url: metadataUrl,
                metadataHash,
            })

            enqueueSnackbar(`Proof Minted! Asset ID: ${result.assetId}`, { variant: 'success' })
        } catch (e) {
            console.error(e)
            enqueueSnackbar('Minting failed. See console.', { variant: 'error' })
        } finally {
            setIsMinting(false)
        }
    }

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    if (!openModal) return null

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-11/12 max-w-5xl">
                <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>✕</button>
                </form>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                        <span>⚔️ Dev-Duel Arena</span>
                        {activeAddress && <span className="badge badge-outline font-mono opacity-70">{activeAddress.slice(0, 8)}...</span>}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* LEFT COL: CONTROLS */}
                    <div className="col-span-1 space-y-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Select Bounty</span></label>
                            <select
                                className="select select-bordered w-full"
                                value={selectedBountyId}
                                onChange={(e) => setSelectedBountyId(e.target.value)}
                                disabled={isRecording}
                            >
                                {MOCK_BOUNTIES.map(b => (
                                    <option key={b.id} value={b.id}>{b.title}</option>
                                ))}
                            </select>
                            <p className="text-xs mt-2 opacity-70 italic">{selectedBounty?.description}</p>
                        </div>

                        {!isRecording && !scoreData && (
                            <button className="btn btn-primary w-full" onClick={startSession}>
                                Start Coding Session
                            </button>
                        )}

                        {isRecording && (
                            <button className="btn btn-error w-full animate-pulse" onClick={endSession}>
                                Stop & Submit
                            </button>
                        )}

                        {/* LIVE SATS */}
                        <div className="stats stats-vertical shadow w-full bg-base-200">
                            <div className="stat">
                                <div className="stat-title">Session Time</div>
                                <div className="stat-value text-2xl">{Math.floor(sessionDuration)}s</div>
                            </div>
                        </div>

                        {/* FLAGS */}
                        {scoreData && (
                            <div className="alert alert-warning shadow-sm text-xs">
                                <div className="flex flex-col items-start w-full">
                                    <span className="font-bold mb-1">Analysis Flags:</span>
                                    <div className="grid grid-cols-2 gap-1 w-full">
                                        <span className={scoreData.flags.botTypingSpeed ? 'text-error font-bold' : 'opacity-50'}>Speed</span>
                                        <span className={scoreData.flags.largePaste ? 'text-error font-bold' : 'opacity-50'}>Paste</span>
                                        <span className={scoreData.flags.zeroBackspace ? 'text-error font-bold' : 'opacity-50'}>No Del</span>
                                        <span className={scoreData.flags.perfectCadence ? 'text-error font-bold' : 'opacity-50'}>Robotic</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: EDITOR & RESULTS */}
                    <div className="col-span-2 space-y-4">
                        {scoreData ? (
                            <div className="bg-base-200 p-6 rounded-lg text-center h-96 flex flex-col justify-center items-center">
                                <h3 className="text-xl font-bold mb-4">Session Analysis Complete</h3>

                                <div className="radial-progress text-primary mb-4" style={{ "--value": scoreData.score, "--size": "8rem" } as any}>
                                    {scoreData.score}%
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-6 w-full">
                                    <div className="stat place-items-center bg-base-100 rounded-box p-2">
                                        <div className="stat-title text-xs">WPM</div>
                                        <div className="stat-value text-xl">{scoreData.stats.wpm}</div>
                                    </div>
                                    <div className="stat place-items-center bg-base-100 rounded-box p-2">
                                        <div className="stat-title text-xs">Backspaces</div>
                                        <div className="stat-value text-xl">{(scoreData.stats.backspaceRatio * 100).toFixed(0)}%</div>
                                    </div>
                                    <div className="stat place-items-center bg-base-100 rounded-box p-2">
                                        <div className="stat-title text-xs">Pastes</div>
                                        <div className="stat-value text-xl">{scoreData.stats.pasteCount}</div>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-center w-full">
                                    <button className="btn btn-outline" onClick={() => setScoreData(null)}>Try Again</button>
                                    <button
                                        className={`btn ${scoreData.score >= 80 ? 'btn-success' : 'btn-disabled'}`}
                                        onClick={mintProof}
                                        disabled={isMinting || scoreData.score < 80}
                                    >
                                        {isMinting ? <span className="loading loading-spinner"></span> : 'Mint Proof of Skill NFT'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <textarea
                                className="textarea textarea-bordered w-full h-96 font-mono leading-normal resize-none"
                                placeholder={isRecording ? "Type your solution here..." : "Click 'Start Coding Session' to begin..."}
                                value={code}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                disabled={!isRecording}
                                spellCheck={false}
                            ></textarea>
                        )}
                    </div>
                </div>
            </div>
        </dialog>
    )
}

export default DevDuel
