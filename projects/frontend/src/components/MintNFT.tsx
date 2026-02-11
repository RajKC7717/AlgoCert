import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { ipfsHttpUrl, pinFileToIPFS, pinJSONToIPFS } from '../utils/pinata'
import { sha256 } from 'js-sha256'

interface MintNFTProps {
  openModal: boolean
  closeModal: () => void
}

const MintNFT = ({ openModal, closeModal }: MintNFTProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  const onMint = async () => {
    if (!activeAddress) return enqueueSnackbar('Connect Wallet first!', { variant: 'warning' })
    if (!file) return enqueueSnackbar('Please select an image', { variant: 'warning' })
    if (!name) return enqueueSnackbar('Please enter a name', { variant: 'warning' })

    setLoading(true)
    try {
      // 1. Upload Image to Pinata (IPFS)
      const filePin = await pinFileToIPFS(file)
      const imageUrl = ipfsHttpUrl(filePin.IpfsHash)

      // 2. Prepare Metadata
      const metadata = {
        name,
        description,
        image: imageUrl,
        properties: { created_by: 'CampusChain' }
      }

      // 3. Upload Metadata to Pinata
      const jsonPin = await pinJSONToIPFS(metadata)
      const metadataUrl = `${ipfsHttpUrl(jsonPin.IpfsHash)}#arc3`

      // 4. Calculate Integrity Hash
      const hashHex = sha256(JSON.stringify(metadata))
      const metadataHash = new Uint8Array(
        hashHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      )

      // 5. Mint on Algorand
      const result = await algorand.send.assetCreate({
        sender: activeAddress,
        total: 1n,
        decimals: 0,
        assetName: name,
        unitName: 'CERT',
        url: metadataUrl,
        metadataHash,
        manager: activeAddress,
        reserve: activeAddress,
        freeze: activeAddress,
        clawback: activeAddress,
      })

      enqueueSnackbar(`Success! Certificate ID: ${result.assetId}`, { variant: 'success' })
      setFile(null)
      setName('')
      closeModal()
    } catch (e) {
      console.error(e)
      enqueueSnackbar('Minting failed. Check console for details.', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // If modal is not open, return null (don't render anything)
  if (!openModal) return null

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Issue Campus Certificate</h3>
        
        <div className="form-control w-full max-w-xs my-4">
          <label className="label"><span className="label-text">Student Name / ID</span></label>
          <input 
            type="text" 
            className="input input-bordered w-full" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-control w-full max-w-xs my-4">
          <label className="label"><span className="label-text">Achievement</span></label>
          <input 
            type="text" 
            className="input input-bordered w-full" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-control w-full max-w-xs my-4">
          <label className="label"><span className="label-text">Certificate Image</span></label>
          <input 
            type="file" 
            className="file-input file-input-bordered w-full" 
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          />
        </div>

        <div className="modal-action">
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={onMint}>
            {loading ? 'Minting...' : 'Issue Certificate'}
          </button>
          <button className="btn" onClick={closeModal}>Close</button>
        </div>
      </div>
    </dialog>
  )
}

export default MintNFT  