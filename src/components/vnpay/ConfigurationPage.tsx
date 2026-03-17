/**
 * Main Configuration Page Component
 * ==================================
 * Displays VNPay configurations and channel mappings
 * 
 * @architecture Clean Architecture - Presentation Layer
 * @patterns Presentational Component (receives data via props)
 */

import React from "react";

import { PageContainer } from "../../layouts";
import { Channel, ChannelMappingsTable } from "./ChannelMappingsTable";
import { ConfigurationForm } from "./ConfigurationForm";
import { ConfigurationTable, VNPayConfig } from "./ConfigurationTable";
import { EmptyState } from "./EmptyState";
import { SectionLayout } from "./SectionLayout";

interface ConfigFormData {
  name: string;
  tmnCode: string;
  hashSecret: string;
  environment: "sandbox" | "production";
}

interface ConfigurationPageProps {
  configs: VNPayConfig[];
  channels: Channel[];
  showAddForm: boolean;
  editingId: string | null;
  formData: ConfigFormData;
  onFormChange: (data: ConfigFormData) => void;
  onShowAddForm: () => void;
  onSaveConfig: () => void;
  onCancelEdit: () => void;
  onEditConfig: (config: VNPayConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAssignChannel: (channelId: string, configId: string) => void;
}

export const ConfigurationPage: React.FC<ConfigurationPageProps> = ({
  configs,
  channels,
  showAddForm,
  editingId,
  formData,
  onFormChange,
  onShowAddForm,
  onSaveConfig,
  onCancelEdit,
  onEditConfig,
  onDeleteConfig,
  onAssignChannel,
}) => {
  return (
    <PageContainer>
      {/* VNPay Configurations Section */}
      <div style={{ marginBottom: "48px" }}>
        <SectionLayout
          title="VNPay Configurations"
          description="Create VNPay configurations that can be later assigned to Saleor channels."
          actionButton={
            !showAddForm &&
            configs.length > 0 && (
              <button
                type="button"
                onClick={onShowAddForm}
                style={{
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  boxShadow: "0 2px 8px rgba(0, 102, 204, 0.3)",
                }}
              >
                Open Logs
              </button>
            )
          }
        >
          {showAddForm && (
            <ConfigurationForm
              formData={formData}
              isEditing={!!editingId}
              onFormChange={onFormChange}
              onSave={onSaveConfig}
              onCancel={onCancelEdit}
            />
          )}

          {!showAddForm && configs.length === 0 ? (
            <EmptyState
              title="No VNPay configurations added."
              description="This means payments are not processed by VNPay."
              buttonText="Add new configuration"
              onButtonClick={onShowAddForm}
            />
          ) : (
            !showAddForm && (
              <ConfigurationTable configs={configs} onEdit={onEditConfig} onDelete={onDeleteConfig} />
            )
          )}
        </SectionLayout>
      </div>

      {/* Saleor Channel Mappings Section */}
      <div>
        <SectionLayout
          title="Saleor channel mappings"
          description="Assign VNPay configurations to Saleor channels."
          titleColor={configs.length === 0 ? "#d1d5db" : "#111827"}
          extraInfo={
            configs.length === 0 && (
              <div>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    color: "#b91c1c",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  No channels have configurations assigned.
                </p>
                <p style={{ margin: 0, color: "#b91c1c", fontSize: "14px", fontWeight: "400" }}>
                  This means payments are not processed by VNPay.
                </p>
              </div>
            )
          }
        >
          {configs.length > 0 && (
            <ChannelMappingsTable
              channels={channels}
              configs={configs}
              onAssignChannel={onAssignChannel}
            />
          )}
        </SectionLayout>
      </div>
    </PageContainer>
  );
};
