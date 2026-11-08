import { motion } from 'framer-motion'

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
}

// Card spring animation
export const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
}

// Stagger children
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
}

// Button press animation
export const buttonTapAnimation = {
  scale: 0.96,
}

// Segmented control slide animation
export const segmentedIndicator = {
  transition: {
    type: 'spring',
    damping: 20,
    stiffness: 300,
  },
}

// Success/error icon draw animation
export const checkIconVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

// Shimmer animation for loading states
export const shimmerAnimation = {
  backgroundPosition: ['0% 0%', '100% 0%'],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
}

// Simple fade in
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
}

// Slide in from left/right
export const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
    },
  },
}

export const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
    },
  },
}

// Scale animation for modals
export const scaleModal = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 250,
    },
  },
}

// Row hover animation (subtle shift)
export const rowHover = {
  x: 4,
  transition: {
    type: 'spring',
    damping: 20,
    stiffness: 300,
  },
}

// Quick utility component for motion div with defaults
export const MotionCard = motion.div
export const MotionButton = motion.button
export const MotionInput = motion.input
