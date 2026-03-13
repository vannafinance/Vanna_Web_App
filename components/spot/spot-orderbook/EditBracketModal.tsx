import OrderPlacementForm from "./OrderPlacementForm";

interface EditBracketModalProps {
  onClose: () => void;
}
export const EditBracketModal = ({ onClose }: EditBracketModalProps) => {
  return (
    <div className="flex flex-col gap-5 bg-[#F7F7F7] rounded-[20px] border border-[#E2E2E2] max-h-[749px]">
      <div className="text-[#111111] text-[24px] leading-9 font-bold px-5 pt-5">
        Edit Bracket
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <OrderPlacementForm mode="edit" onCancel={onClose} />
      </div>
    </div>
  );
};
