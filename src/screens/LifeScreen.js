import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  SafeAreaView, StyleSheet, Platform, Modal,
} from 'react-native';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// Map project name keywords to icons
function getProjectIcon(name) {
  const n = (name || '').toLowerCase();
  if (/skin|acne|face|beauty|moistur|spf|sunscreen/.test(n)) return 'droplet';
  if (/hair|style|curl|straight|colour|color/.test(n)) return 'wind';
  if (/wardrobe|fashion|clothes|outfit|style/.test(n)) return 'shopping-bag';
  if (/fit|gym|run|exercise|health|weight/.test(n)) return 'activity';
  if (/app|code|build|dev|software|website/.test(n)) return 'code';
  if (/cook|bake|food|recipe/.test(n)) return 'coffee';
  if (/read|book|study|learn/.test(n)) return 'book-open';
  if (/music|guitar|piano|sing/.test(n)) return 'music';
  if (/art|paint|draw|design/.test(n)) return 'pen-tool';
  if (/travel|trip|explore/.test(n)) return 'map-pin';
  if (/money|finance|budget|save/.test(n)) return 'trending-up';
  if (/mental|therapy|anxiety|stress|mind/.test(n)) return 'heart';
  if (/social|friend|family|relation/.test(n)) return 'users';
  if (/sleep|rest|energy/.test(n)) return 'moon';
  if (/diet|eat|nutrition|food/.test(n)) return 'feather';
  return 'compass';
}

// Soft colors cycling through life project cards
const PROJECT_ACCENTS = [
  { bg: '#EBF2EE', color: '#5C7A6A' }, // sage
  { bg: '#F7EFE9', color: '#B07050' }, // clay
  { bg: '#EEF0F7', color: '#6470A0' }, // soft indigo
  { bg: '#F5EEF5', color: '#9060A0' }, // soft violet
  { bg: '#FFFBE6', color: '#A08020' }, // warm gold
];

export default function LifeScreen({ navigation }) {
  const { lifeProjects, addLifeProject, removeLifeProject } = useApp();
  const { colors: t } = useTheme();

  const [showAdd,      setShowAdd]      = useState(false);
  const [newName,      setNewName]      = useState('');
  const [menuTarget,   setMenuTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedId,   setExpandedId]   = useState(null);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addLifeProject(name, '', 'general');
    setNewName('');
    setShowAdd(false);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.titleRow}>
          <View>
            <Text style={[s.title, { color: t.text }]}>Life</Text>
            <Text style={[s.sub, { color: t.subtext }]}>Ongoing things Bloom is helping with</Text>
          </View>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: t.accent }]}
            onPress={() => setShowAdd(v => !v)}
          >
            <Icon name="plus" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Add project input */}
        {showAdd && (
          <View style={[s.addCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <TextInput
              style={[s.addInput, { backgroundColor: t.input, borderColor: t.border, color: t.text }]}
              placeholder="What's an ongoing thing in your life? (e.g. Skincare, Hair styling, Wardrobe)"
              placeholderTextColor={t.muted}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              autoFocus
            />
            <TouchableOpacity
              style={[s.addSubmit, { backgroundColor: t.accent }, !newName.trim() && s.addSubmitOff]}
              onPress={handleAdd}
              disabled={!newName.trim()}
            >
              <Text style={s.addSubmitText}>Add →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {lifeProjects.length === 0 && !showAdd && (
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: t.accentPale }]}>
              <Icon name="compass" size={32} color={t.accent} />
            </View>
            <Text style={[s.emptyHead, { color: t.text }]}>Nothing here yet</Text>
            <Text style={[s.emptyBody, { color: t.subtext }]}>
              Dump something in Chat — mention your skin, hair, wardrobe, a project you're working on — and Bloom will add it here automatically.
            </Text>
            <TouchableOpacity style={[s.emptyBtn, { backgroundColor: t.accent }]} onPress={() => setShowAdd(true)}>
              <Text style={s.emptyBtnText}>Add something</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Project cards */}
        {lifeProjects.map((project, idx) => {
          const accent = PROJECT_ACCENTS[idx % PROJECT_ACCENTS.length];
          const icon   = getProjectIcon(project.name);
          const expanded = expandedId === project.id;

          return (
            <TouchableOpacity
              key={project.id}
              style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}
              onPress={() => setExpandedId(expanded ? null : project.id)}
              activeOpacity={0.82}
            >
              {/* Icon + title row */}
              <View style={s.cardHeader}>
                <View style={[s.iconWrap, { backgroundColor: accent.bg }]}>
                  <Icon name={icon} size={20} color={accent.color} />
                </View>
                <Text style={[s.cardTitle, { color: t.text }]}>{project.name}</Text>
                <TouchableOpacity style={s.menuBtn} onPress={() => setMenuTarget(project)}>
                  <Icon name="more-vertical" size={18} color={t.subtext} />
                </TouchableOpacity>
              </View>

              {/* Bloom guidance */}
              {project.guidance ? (
                <Text
                  style={[s.guidanceText, { color: t.subtext }]}
                  numberOfLines={expanded ? undefined : 3}
                >
                  {project.guidance}
                </Text>
              ) : (
                <Text style={[s.noGuidance, { color: t.muted }]}>
                  Mention this in Chat and Bloom will help you work through it.
                </Text>
              )}

              {/* Expand / collapse */}
              {project.guidance && project.guidance.length > 120 && (
                <Text style={[s.expandToggle, { color: accent.color }]}>
                  {expanded ? 'Show less' : 'Read more →'}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Project menu */}
      <Modal visible={!!menuTarget} transparent animationType="slide" onRequestClose={() => setMenuTarget(null)}>
        <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setMenuTarget(null)}>
          <View style={[s.menuSheet, { backgroundColor: t.card }]}>
            <Text style={[s.menuTitle, { color: t.subtext }]} numberOfLines={1}>{menuTarget?.name}</Text>
            <View style={[s.menuDivider, { backgroundColor: t.border }]} />
            <TouchableOpacity style={s.menuItem} onPress={() => { setDeleteTarget(menuTarget); setMenuTarget(null); }}>
              <Icon name="trash-2" size={18} color={t.urgent} />
              <Text style={[s.menuItemText, { color: t.urgent }]}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.menuItem, { justifyContent: 'center' }]} onPress={() => setMenuTarget(null)}>
              <Text style={[s.menuItemText, { color: t.subtext }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete confirm */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Remove from Life?</Text>
            <Text style={[s.modalBody, { color: t.subtext }]} numberOfLines={2}>"{deleteTarget?.name}"</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalCancel, { borderColor: t.border }]} onPress={() => setDeleteTarget(null)}>
                <Text style={[s.modalCancelText, { color: t.subtext }]}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSave, { backgroundColor: t.urgent }]}
                onPress={() => { removeLifeProject(deleteTarget.id); setDeleteTarget(null); }}
              >
                <Text style={s.modalSaveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 24 },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title: {
    fontSize: 28, fontWeight: '600', letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  sub: { fontSize: 13, marginTop: 2, fontWeight: '400' },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 4 },

  addCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 20, gap: 10 },
  addInput: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15 },
  addSubmit: { paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  addSubmitOff: { opacity: 0.35 },
  addSubmitText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyIcon: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyHead: {
    fontSize: 22, fontWeight: '600', marginBottom: 10, letterSpacing: -0.3,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 23, maxWidth: 280, marginBottom: 24 },
  emptyBtn: { paddingVertical: 13, paddingHorizontal: 28, borderRadius: 24 },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  card: {
    borderRadius: 20, borderWidth: 1,
    padding: 20, marginBottom: 14,
    shadowColor: '#C98B6B', shadowOpacity: 0.10, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: {
    flex: 1, fontSize: 17, fontWeight: '700', letterSpacing: -0.2,
    fontFamily: Platform.OS === 'web' ? '"Plus Jakarta Sans", system-ui, sans-serif' : undefined,
  },
  menuBtn: { padding: 4 },

  guidanceText: { fontSize: 14, lineHeight: 23, fontWeight: '400' },
  noGuidance: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  expandToggle: { fontSize: 13, fontWeight: '600', marginTop: 10 },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  menuSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8, paddingBottom: 40 },
  menuTitle: { fontSize: 12, textAlign: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  menuDivider: { height: 1, marginBottom: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 24 },
  menuItemText: { fontSize: 16, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  modalBody: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalSave: { flex: 2, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
