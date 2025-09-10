import React from 'react'
import styled, { keyframes } from 'styled-components'
import { LoadingSpinner } from '../../styles/GlobalStyles'

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.$fullscreen ? '0' : '48px'};
  min-height: ${props => props.$fullscreen ? '100vh' : '200px'};
  background-color: ${props => props.$fullscreen ? props.theme.colors.background : 'transparent'};
  animation: ${fadeIn} 0.3s ease-in-out;
`

const LoadingText = styled.div`
  margin-top: 16px;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  text-align: center;
  
  .main-text {
    color: ${props => props.theme.colors.text};
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .sub-text {
    font-size: 12px;
    opacity: 0.8;
  }
`

const LoadingDots = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
  
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${props => props.theme.colors.primary};
    animation: pulse 1.4s ease-in-out infinite both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0s; }
  }
  
  @keyframes pulse {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background-color: ${props => props.theme.colors.surface};
  border-radius: 2px;
  margin-top: 16px;
  overflow: hidden;
  
  .progress {
    height: 100%;
    background: linear-gradient(90deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.primaryHover});
    border-radius: 2px;
    transition: width 0.3s ease;
    width: ${props => props.progress || 0}%;
  }
`

const LoadingCard = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 32px;
  box-shadow: ${props => props.theme.shadows.lg};
  text-align: center;
  max-width: 300px;
  width: 100%;
`

function Loading({ 
  fullscreen = false, 
  text = 'Carregando...', 
  subText = '', 
  showProgress = false, 
  progress = 0,
  showCard = false,
  size = 'normal'
}) {
  const content = (
    <>
      <LoadingSpinner size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'normal'} />
      
      {text && (
        <LoadingText>
          <div className="main-text">{text}</div>
          {subText && <div className="sub-text">{subText}</div>}
        </LoadingText>
      )}
      
      {showProgress && (
        <ProgressBar progress={progress}>
          <div className="progress" />
        </ProgressBar>
      )}
      
      <LoadingDots>
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </LoadingDots>
    </>
  )
  
  return (
    <LoadingContainer $fullscreen={fullscreen}>
      {showCard ? (
        <LoadingCard>
          {content}
        </LoadingCard>
      ) : (
        content
      )}
    </LoadingContainer>
  )
}

// Componente específico para carregamento de página
export function PageLoading({ text = 'Carregando página...', subText = 'Aguarde um momento' }) {
  return (
    <Loading 
      fullscreen={true} 
      text={text} 
      subText={subText} 
      showCard 
      size="large" 
    />
  )
}

// Componente específico para carregamento de dados
export function DataLoading({ text = 'Carregando dados...', showProgress = false, progress = 0 }) {
  return (
    <Loading 
      text={text} 
      subText="Sincronizando com o servidor" 
      showProgress={showProgress} 
      progress={progress} 
    />
  )
}

// Componente específico para carregamento inline
export function InlineLoading({ text = 'Carregando...', size = 'small' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
      <LoadingSpinner size={size} />
      {text && (
        <span style={{ fontSize: '14px', color: '#D2B48C' }}>
          {text}
        </span>
      )}
    </div>
  )
}

// Componente para overlay de carregamento
export function LoadingOverlay({ show, text = 'Processando...', subText = '' }) {
  if (!show) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <Loading 
        text={text} 
        subText={subText} 
        showCard 
        size="large" 
      />
    </div>
  )
}

export default Loading