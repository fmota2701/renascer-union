import React from 'react'
import styled from 'styled-components'
import { useApp } from '../../contexts/AppContext'
import { Button } from '../../styles/GlobalStyles'
import { LogOut, User, Shield, Settings, Home } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const HeaderContainer = styled.header`
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 2px solid ${props => props.theme.colors.primary};
  padding: 16px 24px;
  box-shadow: ${props => props.theme.shadows.md};
  position: sticky;
  top: 0;
  z-index: 100;
`

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  h1 {
    color: ${props => props.theme.colors.primary};
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }
  
  .version {
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.text};
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
  }
`

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    display: none;
  }
`

const NavButton = styled(Button)`
  ${props => props.active && `
    background-color: ${props.theme.colors.primary};
    border-color: ${props.theme.colors.primary};
  `}
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const UserDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  
  .user-name {
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
  
  .user-role {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    text-transform: capitalize;
  }
  
  @media (max-width: 768px) {
    .user-name, .user-role {
      display: none;
    }
  }
`

const MobileMenu = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background-color: ${props => props.online ? 'rgba(34, 139, 34, 0.2)' : 'rgba(220, 20, 60, 0.2)'};
  border: 1px solid ${props => props.online ? props.theme.colors.success : props.theme.colors.error};
  border-radius: 6px;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.online ? props.theme.colors.success : props.theme.colors.error};
  }
  
  .status-text {
    font-size: 12px;
    color: ${props => props.online ? props.theme.colors.success : props.theme.colors.error};
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .status-text {
      display: none;
    }
  }
`

function Header() {
  const { currentUser, userRole, setCurrentUser, setUserRole, realTimeEnabled } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  
  const handleLogout = () => {
    setCurrentUser(null)
    setUserRole(null)
    localStorage.removeItem('rememberedUser')
    navigate('/login')
  }
  
  const handleNavigation = (path) => {
    navigate(path)
  }
  
  const isActive = (path) => {
    return location.pathname === path
  }
  
  const getRoleIcon = () => {
    return userRole === 'admin' ? <Shield size={16} /> : <User size={16} />
  }
  
  const getNavigationItems = () => {
    if (userRole === 'admin') {
      return [
        { path: '/admin', label: 'Dashboard', icon: <Home size={16} /> },
        { path: '/admin/config', label: 'Configurações', icon: <Settings size={16} /> }
      ]
    } else {
      return [
        { path: '/player', label: 'Dashboard', icon: <Home size={16} /> }
      ]
    }
  }
  
  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo>
          <div>
            <h1>Sistema de Distribuição</h1>
          </div>
          <span className="version">v2.0</span>
        </Logo>
        
        <Navigation>
          {getNavigationItems().map((item) => (
            <NavButton
              key={item.path}
              variant="secondary"
              active={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
            >
              {item.icon}
              {item.label}
            </NavButton>
          ))}
        </Navigation>
        
        <UserInfo>
          <StatusIndicator online={realTimeEnabled}>
            <div className="status-dot" />
            <span className="status-text">
              {realTimeEnabled ? 'Online' : 'Offline'}
            </span>
          </StatusIndicator>
          
          <UserDetails>
            {getRoleIcon()}
            <div>
              <div className="user-name">{currentUser}</div>
              <div className="user-role">{userRole}</div>
            </div>
          </UserDetails>
          
          <Button
            variant="danger"
            size="small"
            onClick={handleLogout}
            title="Sair do sistema"
          >
            <LogOut size={16} />
            <span className="hide-mobile">Sair</span>
          </Button>
        </UserInfo>
        
        <MobileMenu>
          {getNavigationItems().map((item) => (
            <Button
              key={item.path}
              variant="secondary"
              size="small"
              onClick={() => handleNavigation(item.path)}
              title={item.label}
            >
              {item.icon}
            </Button>
          ))}
        </MobileMenu>
      </HeaderContent>
    </HeaderContainer>
  )
}

export default Header