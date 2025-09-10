import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useApp } from '../../contexts/AppContext'
import { Button, Input, Select, Card, Alert } from '../../styles/GlobalStyles'
import { Package, Star, Clock, Check, X, Search, Filter, Heart, Shield, Sword, Trophy, History, BarChart3 } from 'lucide-react'
import Header from '../common/Header'
import { DataLoading } from '../common/Loading'

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`

const WelcomeSection = styled(Card)`
  text-align: center;
  margin-bottom: 32px;
  background: linear-gradient(135deg, ${props => props.theme.colors.surface} 0%, ${props => props.theme.colors.surfaceHover} 100%);
  
  h1 {
    color: ${props => props.theme.colors.primary};
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 16px;
    margin-bottom: 0;
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`

const StatCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  
  .icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.text};
  }
  
  .content {
    flex: 1;
    
    .value {
      font-size: 20px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      margin-bottom: 2px;
    }
    
    .label {
      font-size: 12px;
      color: ${props => props.theme.colors.textSecondary};
    }
  }
`

const FiltersSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  
  .search-container {
    position: relative;
    flex: 1;
    min-width: 250px;
    
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: ${props => props.theme.colors.textSecondary};
    }
    
    input {
      padding-left: 40px;
    }
  }
`

const ItemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`

const ItemCard = styled(Card)`
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
  
  ${props => props.selected && `
    border-color: ${props.theme.colors.success};
    background-color: rgba(34, 139, 34, 0.1);
  `}
  
  ${props => !props.available && `
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
    }
  `}
`

const ItemHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  
  .item-info {
    flex: 1;
    
    .item-name {
      font-size: 18px;
      font-weight: 600;
      color: ${props => props.theme.colors.text};
      margin-bottom: 4px;
    }
    
    .item-type {
      font-size: 12px;
      color: ${props => props.theme.colors.textSecondary};
      text-transform: uppercase;
      font-weight: 500;
    }
  }
  
  .item-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
`

const RarityBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch (props.rarity) {
      case 'common':
        return `
          background-color: rgba(128, 128, 128, 0.2);
          color: #808080;
        `
      case 'uncommon':
        return `
          background-color: rgba(34, 139, 34, 0.2);
          color: #228B22;
        `
      case 'rare':
        return `
          background-color: rgba(70, 130, 180, 0.2);
          color: #4682B4;
        `
      case 'epic':
        return `
          background-color: rgba(138, 43, 226, 0.2);
          color: #8A2BE2;
        `
      case 'legendary':
        return `
          background-color: rgba(255, 140, 0, 0.2);
          color: #FF8C00;
        `
      default:
        return `
          background-color: rgba(128, 128, 128, 0.2);
          color: #808080;
        `
    }
  }}
`

const AvailabilityBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  
  ${props => props.available ? `
    background-color: rgba(34, 139, 34, 0.2);
    color: #228B22;
  ` : `
    background-color: rgba(220, 20, 60, 0.2);
    color: #DC143C;
  `}
`

const ItemDetails = styled.div`
  margin-bottom: 16px;
  
  .level {
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: 8px;
  }
  
  .notes {
    font-size: 13px;
    color: ${props => props.theme.colors.textSecondary};
    line-height: 1.4;
    font-style: italic;
  }
`

const ItemActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const SelectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => props.selected ? `
    color: ${props.theme.colors.success};
  ` : `
    color: ${props.theme.colors.textSecondary};
  `}
`

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${props => props.theme.colors.textSecondary};
  
  .icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    opacity: 0.5;
  }
  
  h3 {
    color: ${props => props.theme.colors.text};
    margin-bottom: 8px;
  }
  
  p {
    margin-bottom: 0;
  }
`

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`

const TabButton = styled.button`
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`

const RankingTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
  
  th {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.primary};
    font-weight: 600;
  }
  
  tr:hover {
    background: ${props => props.theme.colors.background};
  }
`

const HistoryCard = styled(Card)`
  padding: 1rem;
  margin-bottom: 1rem;
  
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .history-date {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.9rem;
  }
  
  .history-status {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    
    &.completed {
      background: ${props => props.theme.colors.success}20;
      color: ${props => props.theme.colors.success};
    }
    
    &.pending {
      background: ${props => props.theme.colors.warning}20;
      color: ${props => props.theme.colors.warning};
    }
  }
`

const MySelectionsSection = styled.div`
  margin-top: 32px;
  
  h2 {
    color: ${props => props.theme.colors.text};
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

const SelectionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SelectionItem = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  
  .selection-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .item-name {
      font-weight: 600;
      color: ${props => props.theme.colors.text};
    }
    
    .selection-date {
      font-size: 12px;
      color: ${props => props.theme.colors.textSecondary};
    }
  }
`

function PlayerDashboard() {
  const {
    items,
    playerSelections,
    currentUser,
    loading,
    error,
    savePlayerSelection,
    deletePlayerSelection,
    clearError
  } = useApp()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterRarity, setFilterRarity] = useState('all')
  const [showAvailableOnly, setShowAvailableOnly] = useState(true)
  const [activeTab, setActiveTab] = useState('items')

  // Dados mockados para ranking
  const rankingData = [
    { position: 1, player: 'DragonSlayer', item: 'Espada Flamejante', points: 2500, status: 'Ativo' },
    { position: 2, player: 'MageSupreme', item: 'Cajado Arcano', points: 2350, status: 'Ativo' },
    { position: 3, player: 'ShadowHunter', item: 'Adaga Sombria', points: 2200, status: 'Ativo' },
    { position: 4, player: 'HolyPaladin', item: 'Escudo Sagrado', points: 2100, status: 'Inativo' },
    { position: 5, player: 'FireWizard', item: 'Orbe de Fogo', points: 2000, status: 'Ativo' }
  ]

  // Dados mockados para histórico geral
  const generalHistory = [
    {
      id: 1,
      event: 'Distribuição de Itens Épicos',
      date: '2024-01-15',
      description: 'Distribuição semanal de itens épicos para todos os jogadores',
      status: 'completed'
    },
    {
      id: 2,
      event: 'Evento Especial - Itens Lendários',
      date: '2024-01-10',
      description: 'Evento especial com distribuição de itens lendários',
      status: 'completed'
    },
    {
      id: 3,
      event: 'Manutenção do Sistema',
      date: '2024-01-08',
      description: 'Manutenção programada do sistema de distribuição',
      status: 'completed'
    }
  ]

  // Dados mockados para histórico individual
  const playerHistory = [
    {
      id: 1,
      item: 'Espada de Cristal',
      date: '2024-01-14',
      action: 'Recebido',
      status: 'completed'
    },
    {
      id: 2,
      item: 'Poção de Vida Grande',
      date: '2024-01-12',
      action: 'Selecionado',
      status: 'pending'
    },
    {
      id: 3,
      item: 'Armadura Élfica',
      date: '2024-01-10',
      action: 'Recebido',
      status: 'completed'
    }
  ]

  // Filtrar itens baseado nos filtros
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || item.type === filterType
    const matchesRarity = filterRarity === 'all' || item.rarity === filterRarity
    const matchesAvailability = !showAvailableOnly || item.available
    
    return matchesSearch && matchesType && matchesRarity && matchesAvailability
  })

  // Seleções do jogador atual
  const mySelections = playerSelections.filter(selection => 
    selection.player_name === currentUser
  )

  // Verificar se um item está selecionado pelo jogador atual
  const isItemSelected = (itemName) => {
    return mySelections.some(selection => selection.item_name === itemName)
  }

  // Estatísticas
  const stats = {
    totalItems: items.length,
    availableItems: items.filter(item => item.available).length,
    mySelections: mySelections.length,
    selectedToday: mySelections.filter(selection => {
      const today = new Date().toDateString()
      const selectionDate = new Date(selection.selected_at).toDateString()
      return today === selectionDate
    }).length
  }

  // Handler para selecionar/desselecionar item
  const handleItemToggle = async (item) => {
    if (!item.available) return

    try {
      const isSelected = isItemSelected(item.name)
      
      if (isSelected) {
        await deletePlayerSelection(currentUser, item.name)
      } else {
        await savePlayerSelection({
          player_name: currentUser,
          item_name: item.name,
          selected_at: new Date().toISOString(),
          priority: 'normal'
        })
      }
    } catch (err) {
      console.error('Erro ao alterar seleção:', err)
    }
  }

  // Handler para remover seleção
  const handleRemoveSelection = async (itemName) => {
    try {
      await deletePlayerSelection(currentUser, itemName)
    } catch (err) {
      console.error('Erro ao remover seleção:', err)
    }
  }

  // Ícone baseado no tipo do item
  const getItemIcon = (type) => {
    switch (type) {
      case 'weapon': return <Sword size={16} />
      case 'armor': return <Shield size={16} />
      case 'accessory': return <Star size={16} />
      default: return <Package size={16} />
    }
  }

  if (loading) {
    return (
      <DashboardContainer>
        <Header />
        <DataLoading text="Carregando itens..." />
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <Header />
      
      <MainContent>
        {error && (
          <Alert type="error" style={{ marginBottom: '24px' }}>
            {error}
            <Button size="small" onClick={clearError} style={{ marginLeft: '12px' }}>
              Fechar
            </Button>
          </Alert>
        )}
        
        {/* Seção de Boas-vindas */}
        <WelcomeSection>
          <h1>Bem-vindo, {currentUser}!</h1>
          <p>Selecione os itens que você gostaria de receber</p>
        </WelcomeSection>
        
        {/* Estatísticas */}
        <StatsGrid>
          <StatCard>
            <div className="icon">
              <Package size={20} />
            </div>
            <div className="content">
              <div className="value">{stats.totalItems}</div>
              <div className="label">Itens Totais</div>
            </div>
          </StatCard>
          
          <StatCard>
            <div className="icon">
              <Star size={20} />
            </div>
            <div className="content">
              <div className="value">{stats.availableItems}</div>
              <div className="label">Disponíveis</div>
            </div>
          </StatCard>
          
          <StatCard>
            <div className="icon">
              <Heart size={20} />
            </div>
            <div className="content">
              <div className="value">{stats.mySelections}</div>
              <div className="label">Minhas Seleções</div>
            </div>
          </StatCard>
          
          <StatCard>
            <div className="icon">
              <Clock size={20} />
            </div>
            <div className="content">
              <div className="value">{stats.selectedToday}</div>
              <div className="label">Hoje</div>
            </div>
          </StatCard>
        </StatsGrid>
        
        {/* Abas */}
        <TabContainer>
          <TabButton 
            active={activeTab === 'items'} 
            onClick={() => setActiveTab('items')}
          >
            <Package size={20} />
            Itens
          </TabButton>
          <TabButton 
            active={activeTab === 'ranking'} 
            onClick={() => setActiveTab('ranking')}
          >
            <Trophy size={20} />
            Ranking
          </TabButton>
          <TabButton 
            active={activeTab === 'history-general'} 
            onClick={() => setActiveTab('history-general')}
          >
            <BarChart3 size={20} />
            Histórico Geral
          </TabButton>
          <TabButton 
            active={activeTab === 'history-individual'} 
            onClick={() => setActiveTab('history-individual')}
          >
            <History size={20} />
            Meu Histórico
          </TabButton>
        </TabContainer>
        
        {/* Conteúdo das Abas */}
        {activeTab === 'items' && (
          <>
            {/* Filtros */}
            <FiltersSection>
              <div className="search-container">
                <Search className="search-icon" size={16} />
                <Input
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todos os tipos</option>
                <option value="weapon">Armas</option>
                <option value="armor">Armaduras</option>
                <option value="accessory">Acessórios</option>
                <option value="consumable">Consumíveis</option>
                <option value="material">Materiais</option>
              </Select>
              
              <Select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
              >
                <option value="all">Todas as raridades</option>
                <option value="common">Comum</option>
                <option value="uncommon">Incomum</option>
                <option value="rare">Raro</option>
                <option value="epic">Épico</option>
                <option value="legendary">Lendário</option>
              </Select>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D2B48C', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  style={{ accentColor: '#8B0000' }}
                />
                Apenas disponíveis
              </label>
            </FiltersSection>
            
            {/* Grid de Itens */}
            {filteredItems.length === 0 ? (
              <EmptyState>
                <Package className="icon" size={64} />
                <h3>Nenhum item encontrado</h3>
                <p>Tente ajustar os filtros para ver mais itens.</p>
              </EmptyState>
            ) : (
              <ItemsGrid>
                {filteredItems.map(item => {
                  const selected = isItemSelected(item.name)
                  
                  return (
                    <ItemCard
                      key={item.name}
                      selected={selected}
                      available={item.available}
                      onClick={() => handleItemToggle(item)}
                    >
                      <ItemHeader>
                        <div className="item-info">
                          <div className="item-name">{item.name}</div>
                          <div className="item-type">{item.type}</div>
                        </div>
                        <div className="item-status">
                          <RarityBadge rarity={item.rarity}>
                            {item.rarity}
                          </RarityBadge>
                          <AvailabilityBadge available={item.available}>
                            {item.available ? 'Disponível' : 'Indisponível'}
                          </AvailabilityBadge>
                        </div>
                      </ItemHeader>
                      
                      <ItemDetails>
                        {item.level && (
                          <div className="level">Nível: {item.level}</div>
                        )}
                        {item.notes && (
                          <div className="notes">{item.notes}</div>
                        )}
                      </ItemDetails>
                      
                      <ItemActions>
                        <SelectionStatus selected={selected}>
                          {selected ? (
                            <>
                              <Check size={14} />
                              Selecionado
                            </>
                          ) : (
                            <>
                              {getItemIcon(item.type)}
                              {item.available ? 'Clique para selecionar' : 'Indisponível'}
                            </>
                          )}
                        </SelectionStatus>
                      </ItemActions>
                    </ItemCard>
                  )
                })}
              </ItemsGrid>
            )}
          </>
        )}
        
        {/* Aba Ranking */}
        {activeTab === 'ranking' && (
          <RankingTable>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Jogador</th>
                <th>Item Principal</th>
                <th>Pontos</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rankingData.map(player => (
                <tr key={player.position}>
                  <td>#{player.position}</td>
                  <td>{player.player}</td>
                  <td>{player.item}</td>
                  <td>{player.points}</td>
                  <td>
                    <span className={`status ${player.status.toLowerCase()}`}>
                      {player.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </RankingTable>
        )}
        
        {/* Aba Histórico Geral */}
        {activeTab === 'history-general' && (
          <div>
            {generalHistory.map(event => (
              <HistoryCard key={event.id}>
                <div className="history-header">
                  <h3>{event.event}</h3>
                  <span className={`history-status ${event.status}`}>
                    {event.status === 'completed' ? 'Concluído' : 'Pendente'}
                  </span>
                </div>
                <p>{event.description}</p>
                <div className="history-date">{new Date(event.date).toLocaleDateString('pt-BR')}</div>
              </HistoryCard>
            ))}
          </div>
        )}
        
        {/* Aba Histórico Individual */}
        {activeTab === 'history-individual' && (
          <div>
            {playerHistory.map(entry => (
              <HistoryCard key={entry.id}>
                <div className="history-header">
                  <h3>{entry.item}</h3>
                  <span className={`history-status ${entry.status}`}>
                    {entry.status === 'completed' ? 'Concluído' : 'Pendente'}
                  </span>
                </div>
                <p>Ação: {entry.action}</p>
                <div className="history-date">{new Date(entry.date).toLocaleDateString('pt-BR')}</div>
              </HistoryCard>
            ))}
          </div>
        )}
        
        {/* Minhas Seleções - Apenas na aba de itens */}
        {activeTab === 'items' && mySelections.length > 0 && (
          <MySelectionsSection>
            <h2>
              <Heart size={20} />
              Minhas Seleções ({mySelections.length})
            </h2>
            
            <SelectionsList>
              {mySelections.map(selection => {
                const item = items.find(i => i.name === selection.item_name)
                
                return (
                  <SelectionItem key={`${selection.player_name}-${selection.item_name}`}>
                    <div className="selection-info">
                      {item && getItemIcon(item.type)}
                      <div>
                        <div className="item-name">{selection.item_name}</div>
                        <div className="selection-date">
                          Selecionado em {new Date(selection.selected_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      {item && (
                        <RarityBadge rarity={item.rarity}>
                          {item.rarity}
                        </RarityBadge>
                      )}
                    </div>
                    
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => handleRemoveSelection(selection.item_name)}
                    >
                      <X size={14} />
                      Remover
                    </Button>
                  </SelectionItem>
                )
              })}
            </SelectionsList>
          </MySelectionsSection>
        )}
      </MainContent>
    </DashboardContainer>
  )
}

export default PlayerDashboard