/**
 * Example: Channels Selector Component
 * Demonstrates how to use useSaleorChannels hook
 */

import React from 'react';

import { useSaleorChannels } from '@/hooks/useSaleorChannels';

interface ChannelsSelectorProps {
  value?: string;
  onChange?: (channelId: string) => void;
  disabled?: boolean;
}

export const ChannelsSelector: React.FC<ChannelsSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { channels, loading, error } = useSaleorChannels();

  if (loading) {
    return (
      <div style={{ 
        padding: '12px', 
        background: '#f3f4f6', 
        borderRadius: '8px',
        color: '#6b7280',
        fontSize: '14px',
      }}>
        ⏳ Loading channels from Saleor...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '12px', 
        background: '#fee2e2', 
        borderRadius: '8px',
        color: '#dc2626',
        fontSize: '14px',
      }}>
        ❌ Error: {error.message}
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div style={{ 
        padding: '12px', 
        background: '#fef3c7', 
        borderRadius: '8px',
        color: '#d97706',
        fontSize: '14px',
      }}>
        ⚠️ No channels found
      </div>
    );
  }

  return (
    <div>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: '600',
        fontSize: '14px',
        color: '#374151',
      }}>
        Select Sales Channel:
      </label>
      
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          background: '#fff',
          color: '#111827',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <option value="">-- Select Channel --</option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            {channel.name} ({channel.currencyCode})
            {!channel.isActive && ' - Inactive'}
          </option>
        ))}
      </select>

      <div style={{ 
        marginTop: '8px', 
        fontSize: '12px', 
        color: '#6b7280' 
      }}>
        Found {channels.length} channel{channels.length !== 1 ? 's' : ''} from Saleor
      </div>
    </div>
  );
};

// Example usage in parent component:
/*
import { ChannelsSelector } from '@/components/common/ChannelsSelector';

function ConfigForm() {
  const [selectedChannel, setSelectedChannel] = useState('');

  return (
    <div>
      <ChannelsSelector 
        value={selectedChannel}
        onChange={setSelectedChannel}
      />
      
      <button onClick={() => console.log('Selected:', selectedChannel)}>
        Save
      </button>
    </div>
  );
}
*/
