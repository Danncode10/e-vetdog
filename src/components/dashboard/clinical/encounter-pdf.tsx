import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 10,
    color: '#4b5563',
    marginTop: 2,
  },
  recordTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  infoBox: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
  },
  infoBoxTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  infoTextLarge: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    width: 50,
    color: '#6b7280',
  },
  infoValue: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 8,
  },
  soapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  soapBox: {
    width: '50%',
    paddingRight: 15,
    marginBottom: 15,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
  },
  tableHeader: {
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  col1: { width: '30%' },
  col2: { width: '70%' },
  colCost: { width: '30%', textAlign: 'right' },
  colName: { width: '70%' },
  prescriptionBox: {
    padding: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    marginBottom: 10,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 9,
    color: '#6b7280',
  },
  signatureBox: {
    width: 200,
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 8,
    height: 40,
  }
});

export const EncounterPDF = ({ data }: { data: any }) => {
  const { encounter, notes, diagnoses, treatments, prescriptions } = data;
  const pet = encounter.pets;
  const vet = encounter.veterinarian;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}`;
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>E-VetDoc Clinic</Text>
            <Text style={styles.subtitle}>123 Veterinary Lane, Metro Manila</Text>
            <Text style={styles.subtitle}>contact@evetdoc.ph • (02) 8123-4567</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.recordTitle}>Clinical Record</Text>
            <Text style={{ marginTop: 8, fontFamily: 'Helvetica-Bold' }}>Date: {formatDate(encounter.created_at)}</Text>
            <Text>Record ID: {encounter.id.split('-')[0].toUpperCase()}</Text>
          </View>
        </View>

        {/* Patient & Vet Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Patient Information</Text>
            <Text style={styles.infoTextLarge}>{pet?.name}</Text>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Species:</Text><Text style={styles.infoValue}>{pet?.species}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Breed:</Text><Text style={styles.infoValue}>{pet?.breed}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Age:</Text><Text style={styles.infoValue}>{pet?.age || '-'} yrs</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Sex:</Text><Text style={styles.infoValue}>{pet?.sex}</Text></View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Attending Veterinarian</Text>
            <Text style={styles.infoTextLarge}>{vet?.full_name}</Text>
            <Text style={styles.subtitle}>{vet?.email}</Text>
            <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Status:</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: encounter.status === 'signed' ? '#000' : '#6b7280' }}>
                {encounter.status === 'signed' ? 'SIGNED FINAL' : 'DRAFT'}
              </Text>
            </View>
          </View>
        </View>

        {/* Clinical Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chief Complaint</Text>
          <Text>{notes?.chief_complaint || 'None recorded.'}</Text>
        </View>
        <View style={styles.soapGrid}>
          <View style={styles.soapBox}>
            <Text style={styles.sectionTitle}>Subjective</Text>
            <Text>{notes?.subjective || '-'}</Text>
          </View>
          <View style={styles.soapBox}>
            <Text style={styles.sectionTitle}>Objective</Text>
            <Text>{notes?.objective || '-'}</Text>
          </View>
          <View style={styles.soapBox}>
            <Text style={styles.sectionTitle}>Assessment</Text>
            <Text>{notes?.assessment || '-'}</Text>
          </View>
          <View style={styles.soapBox}>
            <Text style={styles.sectionTitle}>Plan</Text>
            <Text>{notes?.plan || '-'}</Text>
          </View>
        </View>

        {/* Diagnoses */}
        {diagnoses && diagnoses.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { borderBottomColor: '#000' }]}>Diagnoses</Text>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.col1}>Code</Text>
              <Text style={styles.col2}>Description</Text>
            </View>
            {diagnoses.map((d: any, i: number) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.col1, { fontFamily: 'Helvetica-Bold' }]}>{d.diagnosis_code || '-'}</Text>
                <Text style={styles.col2}>{d.description || '-'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Treatments */}
        {treatments && treatments.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { borderBottomColor: '#000' }]}>Treatments &amp; Procedures</Text>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.colName}>Name</Text>
              <Text style={styles.colCost}>Cost</Text>
            </View>
            {treatments.map((t: any, i: number) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colName}>{t.name || '-'}</Text>
                <Text style={styles.colCost}>PHP {Number(t.cost || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Prescriptions */}
        {prescriptions && prescriptions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { borderBottomColor: '#000' }]}>Prescriptions</Text>
            {prescriptions.map((p: any, i: number) => (
              <View key={i} style={styles.prescriptionBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 13 }}>Rx: {p.medication_name}</Text>
                  <Text style={{ color: '#6b7280' }}>{p.duration}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 20 }}>
                  <View style={{ flexDirection: 'row' }}><Text style={{ color: '#6b7280', width: 60 }}>Dosage:</Text><Text style={{ fontFamily: 'Helvetica-Bold' }}>{p.dosage}</Text></View>
                  <View style={{ flexDirection: 'row' }}><Text style={{ color: '#6b7280', width: 60 }}>Frequency:</Text><Text style={{ fontFamily: 'Helvetica-Bold' }}>{p.frequency}</Text></View>
                </View>
                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                  <Text><Text style={{ color: '#6b7280' }}>Instructions: </Text>{p.instructions || 'Use as directed'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} wrap={false}>
          <View>
            <Text style={styles.footerText}>Generated by E-VetDoc Clinic Management System</Text>
            <Text style={styles.footerText}>Printed on {formatDate(new Date().toISOString())}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{vet?.full_name}</Text>
            <Text style={styles.footerText}>Attending Veterinarian</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
