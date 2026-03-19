import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

const contentVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' } },
};

const sizeClasses = {
  sm: 'max-w-md',
  lg: 'max-w-2xl',
};

export default function ModalShell({ title, onClose, size = 'sm', children }) {
  return (
    <Dialog.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-40 backdrop-blur-sm bg-black/40"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          />
        </Dialog.Overlay>

        {/* Panel */}
        <Dialog.Content asChild>
          <motion.div
            className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-full ${sizeClasses[size]} bg-white rounded-xl shadow-xl
                        flex flex-col max-h-[90vh]`}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <Dialog.Title className="text-lg font-semibold text-gray-800">
                {title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Chiudi"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-6">
              {children}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
