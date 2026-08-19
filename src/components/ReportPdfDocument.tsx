import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { DashboardStats } from '@/types'
import { STATUS_LABELS } from '@/types'
import { isFinished, type ReportBatchGroup } from '@/lib/reportBuckets'

const styles = StyleSheet.create({
  page: {
    paddingTop: 74,
    paddingBottom: 40,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0F172A',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  headerTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 9, color: '#475569', marginTop: 2 },
  headerDate: { fontSize: 8, color: '#64748B', marginTop: 2 },
  headerLogo: { width: 36, height: 36 },
  footer: {
    position: 'absolute',
    bottom: 16,
    right: 32,
    textAlign: 'right',
    fontSize: 8,
    color: '#64748B',
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
  },
  statLabel: { fontSize: 7, color: '#64748B', textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0F172A', marginTop: 2 },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  subTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0F766E', marginBottom: 4 },
  table: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  tHeadRow: { flexDirection: 'row', backgroundColor: '#F1F5F9' },
  tRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569', padding: 4, textTransform: 'uppercase' },
  td: { fontSize: 8, padding: 4, color: '#0F172A' },
  colItemNo: { width: '8%' },
  colDesc: { width: '20%' },
  colCategory: { width: '20%' },
  colDraftsman: { width: '15%' },
  colStatus: { width: '15%' },
  colTarget: { width: '12%' },
  colFinished: { width: '10%', textAlign: 'center' },
  bucketHeading: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F766E',
    marginTop: 8,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  overdue: { color: '#DC2626', fontFamily: 'Helvetica-Bold' },
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#0F172A',
    borderRadius: 1.5,
    marginHorizontal: 'auto',
  },
  checkboxChecked: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  endRule: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  endText: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 9,
    fontFamily: 'Helvetica-BoldOblique',
    color: '#334155',
  },
  sigSection: { marginTop: 36, flexDirection: 'row', justifyContent: 'space-between' },
  sigCol: { width: '45%' },
  sigCaption: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0F172A', marginBottom: 4 },
  sigImageBox: { width: 110, height: 40, alignItems: 'center', justifyContent: 'flex-end' },
  sigImage: { width: 100, height: 32, objectFit: 'contain' },
  // Christian signs big, on paper, straight across his printed name — this
  // box is sized 2x sigImageBox/sigImage and pulled down by half its own
  // height so the signature's vertical center lands right on the line
  // instead of sitting cleanly above it.
  sigImageBoxNoted: { width: 110, height: 80, alignItems: 'center', justifyContent: 'flex-end', marginBottom: -32 },
  sigImageNoted: { width: 200, height: 64, objectFit: 'contain' },
  sigLine: { width: 110, borderTopWidth: 1, borderTopColor: '#0F172A', marginTop: 4 },
  sigName: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 5 },
  sigTitle: { fontSize: 8, color: '#475569', marginTop: 1 },
})

function fmtPct(stats: DashboardStats) {
  return stats.total > 0 ? Math.round(((stats.approved + stats.completed) / stats.total) * 100) : 0
}

function StatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total</Text>
        <Text style={styles.statValue}>{stats.total}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Approved / Completed</Text>
        <Text style={styles.statValue}>{fmtPct(stats)}%</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Revision Required</Text>
        <Text style={styles.statValue}>{stats.revisionRequired}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Overdue</Text>
        <Text style={styles.statValue}>{stats.overdue}</Text>
      </View>
    </View>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return <View style={[styles.checkbox, checked ? styles.checkboxChecked : undefined]} />
}

export function ReportPdfDocument({
  generatedDate,
  overallStats,
  batchStats,
  draftsmanRows,
  itemGroups,
  preparedBySignature,
}: {
  generatedDate: string
  overallStats: DashboardStats
  batchStats: { name: string; stats: DashboardStats }[]
  draftsmanRows: { name: string; assigned: number; ongoing: number; completed: number; total: number }[]
  itemGroups: ReportBatchGroup[]
  /** Data URL of the signature drawn by whoever is exporting (prompted each time it isn't already saved). */
  preparedBySignature: string | null
}) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Document title="Shop Drawing Status Report">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.headerTitle}>Shop Drawing Transparency Tracker — Status Report</Text>
            <Text style={styles.headerSubtitle}>The Spinnaker at Club Laiya — CP19 Contract Package</Text>
            <Text style={styles.headerDate}>As of {generatedDate}</Text>
          </View>
          <Image src="/favicon-512x512.png" style={styles.headerLogo} />
        </View>

        <View style={styles.footer} fixed>
          <Text
            render={({ pageNumber, totalPages }) => `Generated by XA-DOS   (${pageNumber}) of (${totalPages})`}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Summary</Text>
          <StatsRow stats={overallStats} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Batch Summary</Text>
          <View style={styles.twoCol}>
            {batchStats.map((b) => (
              <View key={b.name} style={styles.col}>
                <Text style={styles.subTitle}>{b.name}</Text>
                <StatsRow stats={b.stats} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Draftsman Workload</Text>
          <View style={styles.table}>
            <View style={styles.tHeadRow}>
              <Text style={[styles.th, { width: '34%' }]}>Draftsman</Text>
              <Text style={[styles.th, { width: '16%', textAlign: 'center' }]}>Assigned</Text>
              <Text style={[styles.th, { width: '16%', textAlign: 'center' }]}>Ongoing</Text>
              <Text style={[styles.th, { width: '16%', textAlign: 'center' }]}>Completed</Text>
              <Text style={[styles.th, { width: '18%', textAlign: 'right' }]}>Total</Text>
            </View>
            {draftsmanRows.length === 0 ? (
              <View style={styles.tRow}>
                <Text style={[styles.td, { width: '100%' }]}>No drawings assigned to any draftsman yet.</Text>
              </View>
            ) : (
              draftsmanRows.map((r) => (
                <View key={r.name} style={styles.tRow}>
                  <Text style={[styles.td, { width: '34%' }]}>{r.name}</Text>
                  <Text style={[styles.td, { width: '16%', textAlign: 'center' }]}>{r.assigned}</Text>
                  <Text style={[styles.td, { width: '16%', textAlign: 'center' }]}>{r.ongoing}</Text>
                  <Text style={[styles.td, { width: '16%', textAlign: 'center' }]}>{r.completed}</Text>
                  <Text style={[styles.td, { width: '18%', textAlign: 'right' }]}>{r.total}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full Item Status</Text>
          {itemGroups.map((batchGroup) => (
            <View key={batchGroup.batch}>
              <Text style={styles.subTitle}>{batchGroup.batch}</Text>
              {batchGroup.buckets.map((bucket) => (
                <View key={bucket.label}>
                  <Text style={styles.bucketHeading}>
                    {bucket.label} ({bucket.rows.length})
                  </Text>
                  <View style={styles.table}>
                    <View style={styles.tHeadRow}>
                      <Text style={[styles.th, styles.colItemNo]}>Item No.</Text>
                      <Text style={[styles.th, styles.colDesc]}>Description</Text>
                      <Text style={[styles.th, styles.colCategory]}>Category</Text>
                      <Text style={[styles.th, styles.colDraftsman]}>Draftsman</Text>
                      <Text style={[styles.th, styles.colStatus]}>Status</Text>
                      <Text style={[styles.th, styles.colTarget]}>Target</Text>
                      <Text style={[styles.th, styles.colFinished]}>Finished</Text>
                    </View>
                    {bucket.rows.map((item) => {
                      const overdue =
                        item.target_submission_date &&
                        item.target_submission_date < today &&
                        !['approved', 'completed'].includes(item.status)
                      return (
                        <View key={item.id} style={styles.tRow}>
                          <Text style={[styles.td, styles.colItemNo]}>{item.item_no}</Text>
                          <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
                          <Text style={[styles.td, styles.colCategory]}>{item.category ?? 'Uncategorized'}</Text>
                          <Text style={[styles.td, styles.colDraftsman]}>
                            {item.assigned_draftsman_name ?? 'Unassigned'}
                          </Text>
                          <Text style={[styles.td, styles.colStatus]}>{STATUS_LABELS[item.status]}</Text>
                          <Text style={[styles.td, styles.colTarget, overdue ? styles.overdue : undefined]}>
                            {item.target_submission_date ?? '—'}
                            {overdue ? ' (OVERDUE)' : ''}
                          </Text>
                          <View style={[styles.td, styles.colFinished]}>
                            <Checkbox checked={isFinished(item)} />
                          </View>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.endRule} />
        <Text style={styles.endText}>Nothing follows</Text>

        <View style={styles.sigSection}>
          <View style={styles.sigCol}>
            <Text style={styles.sigCaption}>Prepared by:</Text>
            <View style={styles.sigImageBox}>
              {preparedBySignature && <Image src={preparedBySignature} style={styles.sigImage} />}
            </View>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>Lorraine B. Manalo</Text>
            <Text style={styles.sigTitle}>Cadet Electrical Engr</Text>
          </View>

          <View style={styles.sigCol}>
            <Text style={styles.sigCaption}>Noted by:</Text>
            <View style={styles.sigImageBoxNoted}>
              <Image src="/signature-christian-mendoza.png" style={styles.sigImageNoted} />
            </View>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>Christian Mendoza</Text>
            <Text style={styles.sigTitle}>Project Manager</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
