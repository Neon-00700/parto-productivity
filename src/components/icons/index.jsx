// Centralized icon system for Parto.
// All icons are reusable React components using `currentColor` so they adapt to
// light/dark themes automatically. Consistent stroke width (1.75) + sizing.
import React from 'react';
import {
  FiActivity, FiAward, FiBookOpen, FiCheck, FiCheckCircle, FiChevronDown, FiClock,
  FiCode, FiCpu, FiEdit2, FiExternalLink, FiEye, FiGithub, FiGrid, FiLink,
  FiLock, FiMinus, FiPause, FiPlay, FiPlus, FiSearch, FiSettings, FiShare2,
  FiSquare, FiTarget, FiTrash2, FiTrendingUp, FiUnlock, FiX, FiZap,
  FiArrowDown, FiArrowUp, FiChevronLeft, FiLayers, FiCircle, FiMap, FiCrosshair,
  FiZoomIn, FiZoomOut, FiCheckSquare, FiMoreVertical,
} from 'react-icons/fi';

const make = (Icon) => ({ size = 18, className = '', strokeWidth = 1.75, ...props }) => (
  <Icon size={size} strokeWidth={strokeWidth} className={className} {...props} />
);

export const ActivityIcon = make(FiActivity);
export const AwardIcon = make(FiAward);
export const BookIcon = make(FiBookOpen);
export const CheckIcon = make(FiCheck);
export const CheckCircleIcon = make(FiCheckCircle);
export const ChevronDownIcon = make(FiChevronDown);
export const ClockIcon = make(FiClock);
export const CodeIcon = make(FiCode);
export const CpuIcon = make(FiCpu);
export const EditIcon = make(FiEdit2);
export const ExternalLinkIcon = make(FiExternalLink);
export const EyeIcon = make(FiEye);
export const GitHubIcon = make(FiGithub);
export const GridIcon = make(FiGrid);
export const LayersIcon = make(FiLayers);
export const LinkIcon = make(FiLink);
export const LockIcon = make(FiLock);
export const MinusIcon = make(FiMinus);
export const PauseIcon = make(FiPause);
export const PlayIcon = make(FiPlay);
export const PlusIcon = make(FiPlus);
export const SearchIcon = make(FiSearch);
export const SettingsIcon = make(FiSettings);
export const ShareIcon = make(FiShare2);
export const SquareIcon = make(FiSquare);
export const StopIcon = make(FiSquare);
export const TargetIcon = make(FiTarget);
export const TimerIcon = make(FiClock);
export const TrashIcon = make(FiTrash2);
export const TrendingIcon = make(FiTrendingUp);
export const UnlockIcon = make(FiUnlock);
export const XIcon = make(FiX);
export const ZapIcon = make(FiZap);
export const ArrowDownIcon = make(FiArrowDown);
export const ArrowUpIcon = make(FiArrowUp);
export const BackIcon = make(FiChevronLeft);
export const CircleIcon = make(FiCircle);
export const MapIcon = make(FiMap);
export const CrosshairIcon = make(FiCrosshair);
export const ZoomInIcon = make(FiZoomIn);
export const ZoomOutIcon = make(FiZoomOut);
export const MoreIcon = make(FiMoreVertical);

// Section icons
export const ProgrammingIcon = make(FiCode);
export const ProjectIcon = make(FiGrid);
export const TechnologyIcon = make(FiCpu);
export const SkillTreeIcon = make(FiShare2);
