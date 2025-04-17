import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

// Interface for icon props
interface IconProps {
  icon: string;
  className?: string;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'action' | 'disabled' | 'inherit';
  fontSize?: 'small' | 'medium' | 'large' | 'inherit';
}

// SVG path data for Material-UI icons
const iconPaths: Record<string, string> = {
  'CheckCircle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  'Error': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  'Sync': 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
  'AccountBalance': 'M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z',
  'Receipt': 'M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z',
  'CloudDownload': 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z',
  'VerifiedUser': 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
  'Schedule': 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z'
};

// Custom icon component using our hardcoded paths
export const CustomIcon: React.FC<IconProps> = ({ icon, className, color, fontSize }) => {
  const iconName = icon.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1);
  const path = iconPaths[icon] || '';
  
  if (!path) {
    console.warn(`Icon path not found for "${icon}"`);
    return <span data-mui-icon={iconName}>●</span>;
  }
  
  return (
    <SvgIcon 
      className={className} 
      color={color} 
      fontSize={fontSize}
      data-mui-icon={iconName}
    >
      <path d={path} />
    </SvgIcon>
  );
};

// Create specific icon components
export const CheckCircleIcon = (props: Omit<IconProps, 'icon'>) => <CustomIcon icon="CheckCircle" {...props} />;
export const ErrorIcon = (props: Omit<IconProps, 'icon'>) => <CustomIcon icon="Error" {...props} />;
export const SyncIcon = (props: Omit<IconProps, 'icon'>) => <CustomIcon icon="Sync" {...props} />;
export const AccountBalanceIcon = (props: Omit<IconProps, 'icon'>) => <CustomIcon icon="AccountBalance" {...props} />;
export const ReceiptIcon = (props: Omit<IconProps, 'icon'>) => <CustomIcon icon="Receipt" {...props} />;
export const CloudDownloadIcon = (props: Omit<IconProps, 'icon'>) => <CustomIcon icon="CloudDownload" {...props} />;
export const VerifiedUserIcon = (props: Omit<IconProps, 'icon'>) => <CustomIcon icon="VerifiedUser" {...props} />;
export const ScheduleIcon = (props: Omit<IconProps, 'icon'>) => <CustomIcon icon="Schedule" {...props} />;

export default CustomIcon; 