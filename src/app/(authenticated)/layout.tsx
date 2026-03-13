"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    animate: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  // Define sliding direction based on path
  const direction = pathname === "/reels" ? 1 : -1;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={pathname}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}