import { motion } from 'framer-motion';

const Loader = ({ variant = 'spinner', size = 'md', message = '' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      {variant === 'spinner' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={`w-12 h-12 md:w-16 md:h-16 border-4 border-white/20 border-t-white rounded-full ${size === 'lg' ? 'w-20 h-20' : ''}`}
        />
      )}
      {variant === 'pulse' && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full"
        />
      )}
      {message && <p className="text-white/80 text-center">{message}</p>}
    </div>
  );
};

export default Loader;

