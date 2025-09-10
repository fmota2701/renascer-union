import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useApp } from '../../contexts/AppContext'
import { Button, Input, Select, Card, Table, TableHeader, TableBody, Alert } from '../../styles/GlobalStyles'
import { Plus, Edit2, Trash2, Users, Package, History, Download, Upload, RefreshCw, Search, Filter, Send, CheckCircle } from 'lucide-react'
import Header from '../common/Header'
import { DataLoading, LoadingOverlay } from '../common/Loading'

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`

const StatCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  
  .icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.text};
  }
  
  .content {
    flex: 1;
    
    .value {
      font-size: 24px;
      font-weight: 700;
      color: ${props => props.theme.colors.text};
      margin-bottom: 4px;
    }
    
    .label {
      font-size: 14px;
      color: ${props => props.theme.colors.textSecondary};
    }
  }
`

const TabsContainer = styled.div`
  margin-bottom: 24px;
`

const TabsList = styled.div`
  display: flex;
  gap: 4px;
  background-color: ${props => props.theme.colors.surface};
  padding: 4px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
`

const TabButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  background-color: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.theme.colors.text};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? props.theme.colors.primaryHover : props.theme.colors.surfaceHover};
  }
`

const TabContent = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
  
  h2 {
    color: ${props => props.theme.colors.text};
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }
`

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const SearchContainer = styled.div`
  position: relative;
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
`

const FormModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`

const FormContent = styled(Card)`
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  
  h3 {
    color: ${props => props.theme.colors.text};
    margin-bottom: 24px;
    font-size: 18px;
    font-weight: 600;
  }
`

const FormGrid = styled.div`
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    color: ${props => props.theme.colors.text};
    font-weight: 500;
    font-size: 14px;
  }
`

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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
    margin-bottom: 24px;
  }
`

const DistributionContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const SelectionPanel = styled(Card)`
  padding: 1.5rem;
  
  h3 {
    color: ${props => props.theme.colors.primary};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`

const SelectableGrid = styled.div`
  display: grid;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
`

const SelectableItem = styled.div`
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.selected ? props.theme.colors.primary + '20' : props.theme.colors.surface};
  border-color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border};
  
  &:hover {
    background: ${props => props.selected ? props.theme.colors.primary + '30' : props.theme.colors.surfaceHover};
  }
  
  .item-name {
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    margin-bottom: 0.25rem;
  }
  
  .item-details {
    font-size: 0.875rem;
    color: ${props => props.theme.colors.textSecondary};
  }
`

const DistributionActions = styled(Card)`
  padding: 1.5rem;
  
  h3 {
    color: ${props => props.theme.colors.primary};
    margin-bottom: 1rem;
  }
  
  .summary {
    background: ${props => props.theme.colors.background};
    padding: 1rem;
    border-radius: ${props => props.theme.borderRadius};
    margin-bottom: 1rem;
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
`

function AdminDashboard() {
  const {
    players,
    items,
    history,
    loading,
    error,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addItem,
    updateItem,
    deleteItem,
    addHistoryEntry,
    deleteHistoryEntry,
    clearError
  } = useApp()

  const [activeTab, setActiveTab] = useState('players')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'add-player', 'edit-player', 'add-item', 'edit-item'
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [formData, setFormData] = useState({})
  const [formLoading, setFormLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [distributionNotes, setDistributionNotes] = useState('')

  // Filtrar dados baseado na busca e filtros
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (player.class && player.class.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterType === 'all' || item.type === filterType
    return matchesSearch && matchesFilter
  })

  const filteredHistory = history.filter(entry => {
    return entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           entry.details.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Estatísticas
  const stats = {
    totalPlayers: players.length,
    totalItems: items.length,
    totalHistory: history.length,
    activeItems: items.filter(item => item.available).length
  }

  // Handlers para modais
  const openModal = (type, item = null) => {
    setModalType(type)
    setEditingItem(item)
    setShowModal(true)
    
    if (type === 'add-player') {
      setFormData({ name: '', class: '', level: 1, notes: '' })
    } else if (type === 'edit-player' && item) {
      setFormData({ ...item })
    } else if (type === 'add-item') {
      setFormData({ name: '', type: 'weapon', rarity: 'common', level: 1, available: true, notes: '' })
    } else if (type === 'edit-item' && item) {
      setFormData({ ...item })
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setModalType('')
    setEditingItem(null)
    setFormData({})
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (modalType === 'add-player') {
        await addPlayer({
          ...formData,
          created_at: new Date().toISOString()
        })
        await addHistoryEntry({
          action: 'Jogador Adicionado',
          details: `Jogador ${formData.name} foi adicionado ao sistema`,
          timestamp: new Date().toISOString()
        })
      } else if (modalType === 'edit-player') {
        await updatePlayer(editingItem.name, formData)
        await addHistoryEntry({
          action: 'Jogador Atualizado',
          details: `Jogador ${formData.name} foi atualizado`,
          timestamp: new Date().toISOString()
        })
      } else if (modalType === 'add-item') {
        await addItem({
          ...formData,
          created_at: new Date().toISOString()
        })
        await addHistoryEntry({
          action: 'Item Adicionado',
          details: `Item ${formData.name} foi adicionado ao sistema`,
          timestamp: new Date().toISOString()
        })
      } else if (modalType === 'edit-item') {
        await updateItem(editingItem.name, formData)
        await addHistoryEntry({
          action: 'Item Atualizado',
          details: `Item ${formData.name} foi atualizado`,
          timestamp: new Date().toISOString()
        })
      }
      
      closeModal()
    } catch (err) {
      console.error('Erro ao salvar:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (type, item) => {
    if (!confirm(`Tem certeza que deseja excluir ${type === 'player' ? 'o jogador' : 'o item'} "${item.name}"?`)) {
      return
    }

    try {
      if (type === 'player') {
        await deletePlayer(item.name)
        await addHistoryEntry({
          action: 'Jogador Removido',
          details: `Jogador ${item.name} foi removido do sistema`,
          timestamp: new Date().toISOString()
        })
      } else {
        await deleteItem(item.name)
        await addHistoryEntry({
          action: 'Item Removido',
          details: `Item ${item.name} foi removido do sistema`,
          timestamp: new Date().toISOString()
        })
      }
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
  }

  const handleDeleteHistory = async (entry) => {
    if (!confirm('Tem certeza que deseja excluir esta entrada do histórico?')) {
      return
    }

    try {
      await deleteHistoryEntry(entry.id)
    } catch (err) {
      console.error('Erro ao excluir histórico:', err)
    }
  }

  const exportData = () => {
    const data = {
      players,
      items,
      history,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sistema-distribuicao-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Funções para distribuição
  const handleItemSelection = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.find(i => i.name === item.name)
      if (isSelected) {
        return prev.filter(i => i.name !== item.name)
      } else {
        return [...prev, item]
      }
    })
  }

  const handlePlayerSelection = (player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.find(p => p.name === player.name)
      if (isSelected) {
        return prev.filter(p => p.name !== player.name)
      } else {
        return [...prev, player]
      }
    })
  }

  const handleDistribution = async () => {
    if (selectedItems.length === 0 || selectedPlayers.length === 0) {
      alert('Selecione pelo menos um item e um jogador para distribuição.')
      return
    }

    try {
      setFormLoading(true)
      
      // Criar entrada no histórico para a distribuição
      await addHistoryEntry({
        action: 'Distribuição Realizada',
        details: `${selectedItems.length} itens distribuídos para ${selectedPlayers.length} jogadores. Itens: ${selectedItems.map(i => i.name).join(', ')}. Jogadores: ${selectedPlayers.map(p => p.name).join(', ')}. ${distributionNotes ? 'Notas: ' + distributionNotes : ''}`,
        timestamp: new Date().toISOString()
      })

      // Limpar seleções
      setSelectedItems([])
      setSelectedPlayers([])
      setDistributionNotes('')
      
      alert('Distribuição realizada com sucesso!')
    } catch (err) {
      console.error('Erro na distribuição:', err)
      alert('Erro ao realizar distribuição.')
    } finally {
      setFormLoading(false)
    }
  }

  const tabs = [
    { id: 'players', label: 'Jogadores', icon: <Users size={18} /> },
    { id: 'items', label: 'Itens', icon: <Package size={18} /> },
    { id: 'distribution', label: 'Distribuição', icon: <Send size={18} /> },
    { id: 'history', label: 'Histórico', icon: <History size={18} /> }
  ]

  if (loading) {
    return (
      <DashboardContainer>
        <Header />
        <DataLoading text="Carregando dashboard..." />
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
        
        {/* Estatísticas */}
        <StatsGrid>
          <StatCard>
            <div className="icon">
              <Users size={24} />
            </div>
            <div className="content">
              <div className="value">{stats.totalPlayers}</div>
              <div className="label">Jogadores</div>
            </div>
          </StatCard>
          
          <StatCard>
            <div className="icon">
              <Package size={24} />
            </div>
            <div className="content">
              <div className="value">{stats.totalItems}</div>
              <div className="label">Itens Totais</div>
            </div>
          </StatCard>
          
          <StatCard>
            <div className="icon">
              <Package size={24} />
            </div>
            <div className="content">
              <div className="value">{stats.activeItems}</div>
              <div className="label">Itens Disponíveis</div>
            </div>
          </StatCard>
          
          <StatCard>
            <div className="icon">
              <History size={24} />
            </div>
            <div className="content">
              <div className="value">{stats.totalHistory}</div>
              <div className="label">Registros</div>
            </div>
          </StatCard>
        </StatsGrid>
        
        {/* Tabs */}
        <TabsContainer>
          <TabsList>
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </TabButton>
            ))}
          </TabsList>
        </TabsContainer>
        
        {/* Conteúdo das Tabs */}
        <TabContent active={activeTab === 'players'}>
          <SectionHeader>
            <h2>Gerenciar Jogadores</h2>
            <ActionBar>
              <SearchContainer>
                <Search className="search-icon" size={16} />
                <Input
                  placeholder="Buscar jogadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchContainer>
              <Button onClick={() => openModal('add-player')}>
                <Plus size={16} />
                Adicionar Jogador
              </Button>
            </ActionBar>
          </SectionHeader>
          
          {filteredPlayers.length === 0 ? (
            <EmptyState>
              <Users className="icon" size={64} />
              <h3>Nenhum jogador encontrado</h3>
              <p>Adicione jogadores para começar a gerenciar o sistema.</p>
              <Button onClick={() => openModal('add-player')}>
                <Plus size={16} />
                Adicionar Primeiro Jogador
              </Button>
            </EmptyState>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <tr>
                    <th>Nome</th>
                    <th>Classe</th>
                    <th>Nível</th>
                    <th>Observações</th>
                    <th>Ações</th>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map(player => (
                    <tr key={player.name}>
                      <td><strong>{player.name}</strong></td>
                      <td>{player.class || '-'}</td>
                      <td>{player.level || '-'}</td>
                      <td>{player.notes || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => openModal('edit-player', player)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            onClick={() => handleDelete('player', player)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabContent>
        
        <TabContent active={activeTab === 'items'}>
          <SectionHeader>
            <h2>Gerenciar Itens</h2>
            <ActionBar>
              <SearchContainer>
                <Search className="search-icon" size={16} />
                <Input
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchContainer>
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
              <Button onClick={() => openModal('add-item')}>
                <Plus size={16} />
                Adicionar Item
              </Button>
            </ActionBar>
          </SectionHeader>
          
          {filteredItems.length === 0 ? (
            <EmptyState>
              <Package className="icon" size={64} />
              <h3>Nenhum item encontrado</h3>
              <p>Adicione itens para começar a distribuição.</p>
              <Button onClick={() => openModal('add-item')}>
                <Plus size={16} />
                Adicionar Primeiro Item
              </Button>
            </EmptyState>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Raridade</th>
                    <th>Nível</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <tr key={item.name}>
                      <td><strong>{item.name}</strong></td>
                      <td style={{ textTransform: 'capitalize' }}>{item.type}</td>
                      <td style={{ textTransform: 'capitalize' }}>{item.rarity}</td>
                      <td>{item.level || '-'}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: item.available ? 'rgba(34, 139, 34, 0.2)' : 'rgba(220, 20, 60, 0.2)',
                          color: item.available ? '#228B22' : '#DC143C'
                        }}>
                          {item.available ? 'Disponível' : 'Indisponível'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => openModal('edit-item', item)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            onClick={() => handleDelete('item', item)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabContent>
        
        <TabContent active={activeTab === 'distribution'}>
          <SectionHeader>
            <h2>Distribuição de Itens</h2>
          </SectionHeader>
          
          <DistributionContainer>
            {/* Seleção de Itens */}
            <SelectionPanel>
              <h3>
                <Package size={20} />
                Selecionar Itens ({selectedItems.length})
              </h3>
              <SelectableGrid>
                {items.filter(item => item.available).map(item => (
                  <SelectableItem
                    key={item.name}
                    selected={selectedItems.find(i => i.name === item.name)}
                    onClick={() => handleItemSelection(item)}
                  >
                    <div className="item-name">{item.name}</div>
                    <div className="item-details">
                      {item.type} • {item.rarity} {item.level && `• Nível ${item.level}`}
                    </div>
                  </SelectableItem>
                ))}
              </SelectableGrid>
            </SelectionPanel>
            
            {/* Seleção de Jogadores */}
            <SelectionPanel>
              <h3>
                <Users size={20} />
                Selecionar Jogadores ({selectedPlayers.length})
              </h3>
              <SelectableGrid>
                {players.map(player => (
                  <SelectableItem
                    key={player.name}
                    selected={selectedPlayers.find(p => p.name === player.name)}
                    onClick={() => handlePlayerSelection(player)}
                  >
                    <div className="item-name">{player.name}</div>
                    <div className="item-details">
                      {player.class} {player.level && `• Nível ${player.level}`}
                    </div>
                  </SelectableItem>
                ))}
              </SelectableGrid>
            </SelectionPanel>
          </DistributionContainer>
          
          {/* Ações de Distribuição */}
          <DistributionActions>
            <h3>Resumo da Distribuição</h3>
            <div className="summary">
              <div className="summary-item">
                <span>Itens selecionados:</span>
                <strong>{selectedItems.length}</strong>
              </div>
              <div className="summary-item">
                <span>Jogadores selecionados:</span>
                <strong>{selectedPlayers.length}</strong>
              </div>
            </div>
            
            <FormGroup>
              <label>Notas da Distribuição (opcional)</label>
              <Input
                as="textarea"
                rows={3}
                placeholder="Adicione notas sobre esta distribuição..."
                value={distributionNotes}
                onChange={(e) => setDistributionNotes(e.target.value)}
              />
            </FormGroup>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button
                onClick={handleDistribution}
                disabled={selectedItems.length === 0 || selectedPlayers.length === 0 || formLoading}
              >
                {formLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {formLoading ? 'Distribuindo...' : 'Realizar Distribuição'}
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedItems([])
                  setSelectedPlayers([])
                  setDistributionNotes('')
                }}
              >
                Limpar Seleções
              </Button>
            </div>
          </DistributionActions>
        </TabContent>
        
        <TabContent active={activeTab === 'history'}>
          <SectionHeader>
            <h2>Histórico do Sistema</h2>
            <ActionBar>
              <SearchContainer>
                <Search className="search-icon" size={16} />
                <Input
                  placeholder="Buscar no histórico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchContainer>
              <Button onClick={exportData}>
                <Download size={16} />
                Exportar Dados
              </Button>
            </ActionBar>
          </SectionHeader>
          
          {filteredHistory.length === 0 ? (
            <EmptyState>
              <History className="icon" size={64} />
              <h3>Nenhum registro encontrado</h3>
              <p>O histórico aparecerá aqui conforme você usar o sistema.</p>
            </EmptyState>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Ação</th>
                    <th>Detalhes</th>
                    <th>Ações</th>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map(entry => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.timestamp).toLocaleString('pt-BR')}</td>
                      <td><strong>{entry.action}</strong></td>
                      <td>{entry.details}</td>
                      <td>
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => handleDeleteHistory(entry)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabContent>
      </MainContent>
      
      {/* Modal de Formulário */}
      {showModal && (
        <FormModal onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <FormContent>
            <h3>
              {modalType === 'add-player' && 'Adicionar Jogador'}
              {modalType === 'edit-player' && 'Editar Jogador'}
              {modalType === 'add-item' && 'Adicionar Item'}
              {modalType === 'edit-item' && 'Editar Item'}
            </h3>
            
            <form onSubmit={handleFormSubmit}>
              <FormGrid>
                {(modalType === 'add-player' || modalType === 'edit-player') && (
                  <>
                    <FormGroup>
                      <label>Nome *</label>
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        placeholder="Nome do jogador"
                      />
                    </FormGroup>
                    <FormGroup>
                      <label>Classe</label>
                      <Input
                        value={formData.class || ''}
                        onChange={(e) => setFormData({...formData, class: e.target.value})}
                        placeholder="Classe do jogador"
                      />
                    </FormGroup>
                    <FormGroup>
                      <label>Nível</label>
                      <Input
                        type="number"
                        value={formData.level || 1}
                        onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                        min="1"
                      />
                    </FormGroup>
                    <FormGroup>
                      <label>Observações</label>
                      <Input
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Observações sobre o jogador"
                      />
                    </FormGroup>
                  </>
                )}
                
                {(modalType === 'add-item' || modalType === 'edit-item') && (
                  <>
                    <FormGroup>
                      <label>Nome *</label>
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        placeholder="Nome do item"
                      />
                    </FormGroup>
                    <FormGroup>
                      <label>Tipo *</label>
                      <Select
                        value={formData.type || 'weapon'}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        required
                      >
                        <option value="weapon">Arma</option>
                        <option value="armor">Armadura</option>
                        <option value="accessory">Acessório</option>
                        <option value="consumable">Consumível</option>
                        <option value="material">Material</option>
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <label>Raridade *</label>
                      <Select
                        value={formData.rarity || 'common'}
                        onChange={(e) => setFormData({...formData, rarity: e.target.value})}
                        required
                      >
                        <option value="common">Comum</option>
                        <option value="uncommon">Incomum</option>
                        <option value="rare">Raro</option>
                        <option value="epic">Épico</option>
                        <option value="legendary">Lendário</option>
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <label>Nível</label>
                      <Input
                        type="number"
                        value={formData.level || 1}
                        onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                        min="1"
                      />
                    </FormGroup>
                    <FormGroup>
                      <label>
                        <input
                          type="checkbox"
                          checked={formData.available !== false}
                          onChange={(e) => setFormData({...formData, available: e.target.checked})}
                          style={{ marginRight: '8px' }}
                        />
                        Item disponível para distribuição
                      </label>
                    </FormGroup>
                    <FormGroup>
                      <label>Observações</label>
                      <Input
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Observações sobre o item"
                      />
                    </FormGroup>
                  </>
                )}
              </FormGrid>
              
              <FormActions>
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </FormActions>
            </form>
          </FormContent>
        </FormModal>
      )}
      
      <LoadingOverlay show={formLoading} text="Salvando dados..." />
    </DashboardContainer>
  )
}

export default AdminDashboard