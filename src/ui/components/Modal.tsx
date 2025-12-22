import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "lg" | "xl";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "lg",
}) => {
  const [show, setShow] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "max-w-sm";
      case "lg":
        return "max-w-lg";
      case "xl":
        return "max-w-2xl";
      default:
        return "max-w-lg";
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setShow(true);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <div
      className={
        `fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 transition-opacity duration-300 ease-in-out ` +
        (visible ? "opacity-100" : "opacity-0")
      }
      onClick={onClose}
    >
      <div
        className={
          `w-full ${getSizeClass()} transform border border-white/20 bg-[#091E38] p-6 transition-transform duration-300 ease-in-out ` +
          (visible ? "scale-100" : "scale-95")
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-medium text-white">{title}</h2>}
          <button onClick={onClose} className="text-white/50 hover:text-white">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
