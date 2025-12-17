'use client'

interface ContractErrorProps {
  onRetry: () => void
}

export default function ContractError({ onRetry }: ContractErrorProps) {
  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>
          Contract Configuration Required
        </h2>
        
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#721c24' }}>
            Setup Required:
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#721c24' }}>
            <li>Create <code>.env.local</code> file in project root</li>
            <li>Deploy contract: <code>npm run deploy:sepolia</code></li>
            <li>Add contract address to .env.local:</li>
          </ol>
          <pre style={{ 
            backgroundColor: '#fff', 
            padding: '8px', 
            borderRadius: '4px', 
            marginTop: '8px',
            fontSize: '14px',
            color: '#333'
          }}>
            NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
          </pre>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#721c24' }}>
            4. Restart development server: <code>npm run dev</code>
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>
            Need Help?
          </h4>
          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
            Follow the setup guide in README.md or run:
          </p>
          <code style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            ./quick-start.sh
          </code>
        </div>

        <button
          className="button"
          onClick={onRetry}
          style={{ 
            padding: '12px 24px',
            marginBottom: '16px'
          }}
        >
          Retry Connection
        </button>

        <div style={{ fontSize: '12px', color: '#666' }}>
          Make sure to restart the development server after adding environment variables
        </div>
      </div>
    </div>
  )
}