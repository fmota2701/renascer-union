import styled, { createGlobalStyle } from 'styled-components'

// Tema Apple-inspired com cores dark e red
export const theme = {
  colors: {
    primary: '#DC143C',
    primaryHover: '#FF1744',
    secondary: '#FF4444',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceHover: '#2C2C2E',
    surfaceSecondary: '#3A3A3C',
    text: '#FFFFFF',
    textSecondary: '#AEAEB2',
    textTertiary: '#8E8E93',
    border: 'rgba(220, 20, 60, 0.3)',
    borderSecondary: 'rgba(255, 255, 255, 0.1)',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#007AFF'
  },
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '20px',
    xxxl: '24px',
    xxxxl: '32px'
  },
  borderRadius: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    xxl: '16px'
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    xl: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)'
  },
  transitions: {
    fast: '0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    normal: '0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    slow: '0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    sizes: {
      xs: '11px',
      sm: '13px',
      md: '15px',
      lg: '17px',
      xl: '20px',
      xxl: '24px',
      xxxl: '28px',
      xxxxl: '34px'
    }
  }
}

// Estilos globais
export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    font-family: ${theme.typography.fontFamily};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
    line-height: 1.47059;
    font-size: ${theme.typography.sizes.md};
    font-weight: ${theme.typography.fontWeights.regular};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* Apple-style scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    transition: ${theme.transitions.fast};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Apple-style focus */
  *:focus {
    outline: none;
  }

  *:focus-visible {
    outline: 2px solid ${theme.colors.info};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }

  /* Selection styles */
  ::selection {
    background-color: ${theme.colors.primary};
    color: ${theme.colors.text};
  }

  /* Button reset */
  button {
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
  }

  /* Input reset */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  /* Link reset */
  a {
    color: inherit;
    text-decoration: none;
  }

  /* List reset */
  ul, ol {
    list-style: none;
  }

  /* Table reset */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }

  .flex {
    display: flex;
  }

  .flex-column {
    flex-direction: column;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .align-center {
    align-items: center;
  }

  .gap-sm {
    gap: ${theme.spacing.sm};
  }

  .gap-md {
    gap: ${theme.spacing.md};
  }

  .gap-lg {
    gap: ${theme.spacing.lg};
  }

  .mb-sm {
    margin-bottom: ${theme.spacing.sm};
  }

  .mb-md {
    margin-bottom: ${theme.spacing.md};
  }

  .mb-lg {
    margin-bottom: ${theme.spacing.lg};
  }

  .mt-sm {
    margin-top: ${theme.spacing.sm};
  }

  .mt-md {
    margin-top: ${theme.spacing.md};
  }

  .mt-lg {
    margin-top: ${theme.spacing.lg};
  }

  .p-sm {
    padding: ${theme.spacing.sm};
  }

  .p-md {
    padding: ${theme.spacing.md};
  }

  .p-lg {
    padding: ${theme.spacing.lg};
  }

  .w-full {
    width: 100%;
  }

  .h-full {
    height: 100%;
  }

  /* Animation classes */
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  .slide-in {
    animation: slideIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Loading animation */
  .loading {
    position: relative;
    overflow: hidden;
  }

  .loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(139, 0, 0, 0.2),
      transparent
    );
    animation: loading 1.5s infinite;
  }

  @keyframes loading {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  /* Responsive breakpoints */
  @media (max-width: 768px) {
    .hide-mobile {
      display: none !important;
    }
  }

  @media (min-width: 769px) {
    .hide-desktop {
      display: none !important;
    }
  }
`

// Media Queries - Apple-style breakpoints
export const mediaQueries = {
  mobile: '@media (max-width: 767px)',
  tablet: '@media (min-width: 768px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px)',
  largeDesktop: '@media (min-width: 1440px)',
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'
}

// Componentes styled reutilizáveis
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${theme.spacing.md};
  width: 100%;
`

export const Card = styled.div`
  background-color: ${theme.colors.surface};
  border: 1px solid ${theme.colors.borderSecondary};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xxxl};
  box-shadow: ${theme.shadows.sm};
  transition: ${theme.transitions.normal};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  &:hover {
    background-color: ${theme.colors.surfaceHover};
    border-color: ${theme.colors.border};
    box-shadow: ${theme.shadows.md};
    transform: translateY(-1px);
  }
`

export const Button = styled.button`
  background-color: ${props => {
    if (props.variant === 'secondary') return theme.colors.surface
    if (props.variant === 'danger') return theme.colors.error
    if (props.variant === 'success') return theme.colors.success
    return theme.colors.primary
  }};
  color: ${theme.colors.text};
  border: 1px solid ${props => {
    if (props.variant === 'secondary') return theme.colors.borderSecondary
    if (props.variant === 'danger') return theme.colors.error
    if (props.variant === 'success') return theme.colors.success
    return theme.colors.primary
  }};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: ${theme.transitions.fast};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.md};
  min-height: 44px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  &:hover:not(:disabled) {
    background-color: ${props => {
      if (props.variant === 'secondary') return theme.colors.surfaceHover
      if (props.variant === 'danger') return '#FF6B6B'
      if (props.variant === 'success') return '#40E070'
      return theme.colors.primaryHover
    }};
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.md};
    border-color: ${props => {
      if (props.variant === 'secondary') return theme.colors.border
      if (props.variant === 'danger') return '#FF6B6B'
      if (props.variant === 'success') return '#40E070'
      return theme.colors.primaryHover
    }};
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${theme.shadows.sm};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  ${props => props.size === 'small' && `
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    font-size: ${theme.typography.sizes.xs};
    min-height: 32px;
    border-radius: ${theme.borderRadius.md};
  `}

  ${props => props.size === 'large' && `
    padding: ${theme.spacing.xl} ${theme.spacing.xxl};
    font-size: ${theme.typography.sizes.md};
    min-height: 52px;
    border-radius: ${theme.borderRadius.xxl};
  `}

  ${props => props.fullWidth && `
    width: 100%;
  `}
`

export const Input = styled.input`
  background-color: ${theme.colors.surface};
  border: 1px solid ${theme.colors.borderSecondary};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  color: ${theme.colors.text};
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.fontWeights.regular};
  transition: ${theme.transitions.fast};
  width: 100%;
  min-height: 44px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  &::placeholder {
    color: ${theme.colors.textTertiary};
    font-weight: ${theme.typography.fontWeights.regular};
  }

  &:focus {
    border-color: ${theme.colors.info};
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
    background-color: ${theme.colors.surfaceHover};
  }

  &:hover:not(:focus) {
    border-color: ${theme.colors.border};
    background-color: ${theme.colors.surfaceHover};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background-color: ${theme.colors.surfaceSecondary};
  }

  ${props => props.error && `
    border-color: ${theme.colors.error};
    box-shadow: 0 0 0 3px rgba(255, 69, 58, 0.2);
  `}
`

export const Select = styled.select`
  background-color: ${theme.colors.surface};
  border: 1px solid ${theme.colors.borderSecondary};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  color: ${theme.colors.text};
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.fontWeights.regular};
  transition: ${theme.transitions.fast};
  width: 100%;
  min-height: 44px;
  cursor: pointer;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23AEAEB2' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right ${theme.spacing.xl} center;
  background-size: 16px;
  padding-right: ${theme.spacing.xxxxl};

  &:focus {
    border-color: ${theme.colors.info};
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
    background-color: ${theme.colors.surfaceHover};
  }

  &:hover:not(:focus) {
    border-color: ${theme.colors.border};
    background-color: ${theme.colors.surfaceHover};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background-color: ${theme.colors.surfaceSecondary};
  }

  option {
    background-color: ${theme.colors.surface};
    color: ${theme.colors.text};
    padding: ${theme.spacing.lg};
  }
`

export const Textarea = styled.textarea`
  background-color: ${theme.colors.surface};
  border: 1px solid ${theme.colors.borderSecondary};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  color: ${theme.colors.text};
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.fontWeights.regular};
  line-height: 1.5;
  transition: ${theme.transitions.fast};
  width: 100%;
  min-height: 120px;
  resize: vertical;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  &::placeholder {
    color: ${theme.colors.textTertiary};
    font-weight: ${theme.typography.fontWeights.regular};
  }

  &:focus {
    border-color: ${theme.colors.info};
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
    background-color: ${theme.colors.surfaceHover};
  }

  &:hover:not(:focus) {
    border-color: ${theme.colors.border};
    background-color: ${theme.colors.surfaceHover};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background-color: ${theme.colors.surfaceSecondary};
  }

  ${props => props.error && `
    border-color: ${theme.colors.error};
    box-shadow: 0 0 0 3px rgba(255, 69, 58, 0.2);
  `}
`

export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.xxl};
  overflow: hidden;
  box-shadow: ${theme.shadows.md};
  border: 1px solid ${theme.colors.borderSecondary};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
`

export const TableHeader = styled.thead`
  background-color: ${theme.colors.surfaceSecondary};
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  
  th {
    padding: ${theme.spacing.xl} ${theme.spacing.xxl};
    text-align: left;
    color: ${theme.colors.textSecondary};
    font-family: ${theme.typography.fontFamily};
    font-weight: ${theme.typography.fontWeights.semibold};
    font-size: ${theme.typography.sizes.xs};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 2px solid ${theme.colors.borderSecondary};
  }
`

export const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${theme.colors.borderSecondary};
    transition: ${theme.transitions.normal};
    
    &:hover {
      background-color: ${theme.colors.surfaceHover};
      transform: translateY(-1px);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: ${theme.spacing.xl} ${theme.spacing.xxl};
    text-align: left;
    color: ${theme.colors.text};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.sizes.sm};
    font-weight: ${theme.typography.fontWeights.regular};
    line-height: 1.5;
  }
`

export const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.xxxl};
  animation: fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

export const ModalContent = styled.div`
  background-color: ${theme.colors.surface};
  border: 1px solid ${theme.colors.borderSecondary};
  border-radius: ${theme.borderRadius.xxl};
  padding: ${theme.spacing.xxxxl};
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${theme.shadows.xl};
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`

export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.borderSecondary};
  border-top: 3px solid ${theme.colors.info};
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  margin: ${theme.spacing.xxxl} auto;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  @keyframes spin {
    0% { 
      transform: rotate(0deg);
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
    100% { 
      transform: rotate(360deg);
      opacity: 1;
    }
  }
  
  ${props => props.size === 'large' && `
    width: 64px;
    height: 64px;
    border-width: 4px;
    margin: ${theme.spacing.xxxxl} auto;
  `}
  
  ${props => props.size === 'small' && `
    width: 24px;
    height: 24px;
    border-width: 2px;
    margin: ${theme.spacing.xl} auto;
  `}
`

export const Alert = styled.div`
  padding: ${theme.spacing.xl} ${theme.spacing.xxl};
  border-radius: ${theme.borderRadius.xxl};
  margin-bottom: ${theme.spacing.xl};
  border: 1px solid transparent;
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  line-height: 1.5;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: ${theme.shadows.sm};
  transition: ${theme.transitions.normal};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.md};
  }
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background-color: rgba(52, 199, 89, 0.15);
          border-color: rgba(52, 199, 89, 0.3);
          color: #34C759;
        `
      case 'warning':
        return `
          background-color: rgba(255, 204, 0, 0.15);
          border-color: rgba(255, 204, 0, 0.3);
          color: #FFCC00;
        `
      case 'error':
        return `
          background-color: rgba(255, 69, 58, 0.15);
          border-color: rgba(255, 69, 58, 0.3);
          color: #FF453A;
        `
      default:
        return `
          background-color: rgba(0, 122, 255, 0.15);
          border-color: rgba(0, 122, 255, 0.3);
          color: #007AFF;
        `
    }
  }}
`