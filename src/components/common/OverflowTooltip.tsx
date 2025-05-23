import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from '@mui/material';

interface OverflowTooltipProps {
  children: React.ReactNode;
}

const OverflowTooltip: React.FC<OverflowTooltipProps> = ({ children }) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsOverflowed(el.scrollWidth > el.clientWidth);
    }
  }, [children]);

  return (
    <Tooltip title={children ?? ''} disableHoverListener={!isOverflowed} arrow>
      <span
        ref={textRef}
        style={{
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </Tooltip>
  );
};

export default OverflowTooltip;
