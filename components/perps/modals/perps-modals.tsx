import { PerpsModalType, PerpsOrderPlacementFormValues } from "@/lib/types";
import { Modal } from "../../ui/modal";
import { UseFormSetValue } from "react-hook-form";
import { AdjustLeverageModal } from "./adjust-leverage-modal";
import { AssetModeModal } from "./asset-mode-modal";
import { MarginModeModal } from "./margin-mode-modal";
import { PositionModeModal } from "./position-mode-modal";
import { SplitSettingsModal } from "./split-settings-modal";
import { OrderPreferenceModal } from "./order-preference-modal";
import { AccountModal } from "./account-modal";
import { FuturesUnitSettingsModal } from "./futures-unit-settings-modal";

interface PerpsModalsProps {
  activeModal: PerpsModalType;
  close: () => void;
  setValue: UseFormSetValue<PerpsOrderPlacementFormValues>;
  formValues: PerpsOrderPlacementFormValues;
}

const PerpsModals = ({ activeModal, close, setValue, formValues }: PerpsModalsProps) => {
  if (!activeModal) return null;

  return (
    <Modal open={true} onClose={close}>
      {activeModal === "leverage" && (
        <AdjustLeverageModal
          pair="ETHUSDT"
          defaultValue={formValues.leverage}
          max={20}
          onClose={close}
          onConfirm={(val) => {
            setValue("leverage", val);
          }}
        />
      )}
      {activeModal === "assetMode" && (
        <AssetModeModal
          defaultMode={formValues.assetMode}
          onClose={close}
          onConfirm={(mode) => {
            setValue("assetMode", mode);
          }}
        />
      )}
      {activeModal === "marginMode" && (
        <MarginModeModal
          pair="ETHUSDT"
          defaultMode={formValues.marginMode}
          onClose={close}
          onConfirm={(mode) => {
            setValue("marginMode", mode);
          }}
        />
      )}
      {activeModal === "positionMode" && (
        <PositionModeModal
          defaultMode={formValues.positionMode}
          onClose={close}
          onConfirm={(mode) => {
            setValue("positionMode", mode);
          }}
        />
      )}
      {activeModal === "splitSettings" && (
        <SplitSettingsModal
          defaultMode={formValues.splitSettings}
          onClose={close}
          onConfirm={(mode) => {
            setValue("splitSettings", mode);
          }}
        />
      )}
      {activeModal === "orderPreference" && (
        <OrderPreferenceModal
          defaultMode={formValues.orderPreference}
          onClose={close}
          onConfirm={(mode) => {
            setValue("orderPreference", mode);
          }}
        />
      )}
      {activeModal === "account" && (
        <AccountModal onClose={close} />
      )}
      {activeModal === "futuresUnitSettings" && (
        <FuturesUnitSettingsModal
          onClose={close}
          onConfirm={(_orderType, quantityUnit) => {
            setValue("quantityUnit", quantityUnit);
          }}
        />
      )}
    </Modal>
  );
};

export default PerpsModals;
