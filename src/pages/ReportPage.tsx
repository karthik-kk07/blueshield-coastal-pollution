import React, { useState, useEffect, useRef } from 'react';
import { AppRoute } from '../types/navigation';
import { useIncidents } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { createReport } from '../services/reportService';
import { uploadReportPhoto, validateImageFile } from '../services/imageUploadService';
import { LocationPickerMap } from '../components/map/LocationPickerMap';
import { ReportDoc } from '../types/firestore';
import { PollutionReport, WasteCategory } from '../types/pollution';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  MapPin,
  AlertTriangle,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Compass,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Trash2,
} from 'lucide-react';

interface ReportPageProps {
  onNavigate: (route: AppRoute) => void;
}

// 11 Required Pollution Types
export const POLLUTION_TYPES = [
  'Plastic',
  'Food Packaging',
  'Fishing Waste',
  'Glass',
  'Metal',
  'Organic Waste',
  'Drain Pollution',
  'Sewage / Wastewater',
  'Illegal Dumping',
  'Mixed Waste',
  'Other',
] as const;

export type PollutionType = (typeof POLLUTION_TYPES)[number];

// 4 Required Severity Levels
export const SEVERITY_LEVELS = [
  {
    key: 'LOW',
    label: 'LOW',
    desc: 'Isolated, non-hazardous litter or scattered debris',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ringClass: 'ring-emerald-500 border-emerald-500 bg-emerald-50/60',
  },
  {
    key: 'MODERATE',
    label: 'MODERATE',
    desc: 'Concentrated accumulation affecting 10–50m of shoreline',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    ringClass: 'ring-amber-500 border-amber-500 bg-amber-50/60',
  },
  {
    key: 'HIGH',
    label: 'HIGH',
    desc: 'Dense marine debris, entangled fishing gear, or nala outfall',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
    ringClass: 'ring-orange-500 border-orange-500 bg-orange-50/60',
  },
  {
    key: 'CRITICAL',
    label: 'CRITICAL',
    desc: 'Active chemical sheen, toxic sewage breach, or wildlife entanglement hazard',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    ringClass: 'ring-rose-500 border-rose-500 bg-rose-50/60',
  },
] as const;

export type SeverityType = (typeof SEVERITY_LEVELS)[number]['key'];

// Notable Visakhapatnam Shoreline Presets for Quick Selection
const SHORELINE_PRESETS = [
  { name: 'RK Beach (Submarine Museum)', lat: 17.7155, lng: 83.3285 },
  { name: 'Rushikonda Blue Flag Beach', lat: 17.7818, lng: 83.3855 },
  { name: 'Fishing Harbour Breakwater', lat: 17.6982, lng: 83.3045 },
  { name: 'Lawson’s Bay Artisanal Cove', lat: 17.732, lng: 83.341 },
  { name: 'Tenneti Park Rocky Coast', lat: 17.7475, lng: 83.354 },
  { name: 'Yarada Headland / Dolphin’s Nose', lat: 17.6548, lng: 83.2687 },
];

export const ReportPage: React.FC<ReportPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { addDirectReport, setSelectedReportId } = useIncidents();

  // 1. Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 2. Location & GPS state
  const [latitude, setLatitude] = useState<number>(17.7155);
  const [longitude, setLongitude] = useState<number>(83.3285);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'detected' | 'failed'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [coastalZone, setCoastalZone] = useState<string>('Ramakrishna (RK) Beach, Visakhapatnam');

  // 3. Pollution type state
  const [pollutionType, setPollutionType] = useState<PollutionType>('Plastic');

  // 4. Severity state
  const [severity, setSeverity] = useState<SeverityType>('MODERATE');

  // 5. Description state
  const [description, setDescription] = useState<string>('');

  // Submission & Loading state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success view state
  const [submittedReport, setSubmittedReport] = useState<ReportDoc | null>(null);

  // Automatic browser geolocation request on initial mount
  useEffect(() => {
    requestGeolocation();
  }, []);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('failed');
      setGpsMessage('Location unavailable — select your location manually.');
      return;
    }

    setGpsStatus('requesting');
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        setGpsStatus('detected');
        setGpsMessage('Location detected');
      },
      (err) => {
        console.warn('Geolocation failed or denied:', err.message);
        setGpsStatus('failed');
        setGpsMessage('Location unavailable — select your location manually.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Photo handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error || 'Invalid file.');
      return;
    }

    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // 1. Generate human-readable report number (e.g. BS-2026-0001)
      const currentYear = new Date().getFullYear();
      const randomSeq = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
      const generatedReportNumber = `BS-${currentYear}-${randomSeq}`;
      const uniqueId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // 2. Upload photo if present
      let uploadedPhotoUrl = '';
      if (photoFile) {
        const uploadResult = await uploadReportPhoto(photoFile, generatedReportNumber);
        uploadedPhotoUrl = uploadResult.url;
      }

      // 3. Determine reportedBy field
      const reporterDisplayName =
        user?.displayName ||
        user?.name ||
        (user?.email ? user.email.split('@')[0] : 'Citizen Observer');

      // 4. Create Firestore Report Document
      const newReportData: ReportDoc = {
        id: uniqueId,
        reportNumber: generatedReportNumber,
        reportedBy: reporterDisplayName,
        latitude,
        longitude,
        pollutionType,
        severity,
        description: description.trim(),
        photoUrl: uploadedPhotoUrl,
        status: 'REPORTED',
        createdAt: new Date().toISOString(),
        trackingCode: generatedReportNumber,
        title: `${pollutionType} Pollution Hazard`,
        coastalZone,
        reporterId: user?.id || 'citizen-anonymous',
        entryPointSource: 'Shoreline Intertidal',
      };

      const savedDoc = await createReport(newReportData);

      // 5. Sync with incident state for immediate visibility across app
      const mapWasteCategory = (pType: string): WasteCategory => {
        if (pType === 'Fishing Waste') return 'derelict_fishing_gear';
        if (pType === 'Sewage / Wastewater' || pType === 'Drain Pollution') return 'wastewater_sewage';
        if (pType === 'Plastic' || pType === 'Food Packaging') return 'macro_plastics';
        if (pType === 'Illegal Dumping' || pType === 'Metal' || pType === 'Glass') return 'bulk_construction';
        return 'macro_plastics';
      };

      let basePriority = 50;
      if (severity === 'CRITICAL') basePriority = 90;
      else if (severity === 'HIGH') basePriority = 75;
      else if (severity === 'LOW') basePriority = 30;

      const contextPollutionReport: PollutionReport = {
        id: savedDoc.id,
        trackingCode: savedDoc.reportNumber || generatedReportNumber,
        reportNumber: savedDoc.reportNumber || generatedReportNumber,
        title: savedDoc.title || `${pollutionType} Hazard`,
        description: savedDoc.description,
        wasteCategory: mapWasteCategory(pollutionType),
        pollutionType,
        severity: (severity.toLowerCase() as 'low' | 'moderate' | 'high' | 'critical'),
        status: 'REPORTED',
        priorityScore: basePriority,
        location: {
          latitude,
          longitude,
          coastalZoneName: coastalZone,
          nearestLandmark: 'Visakhapatnam Shoreline Sector',
        },
        reportedByUserId: user?.id || 'citizen-anonymous',
        reportedByName: reporterDisplayName,
        reportedAt: savedDoc.createdAt,
        imageUrl: uploadedPhotoUrl || undefined,
        photoUrl: uploadedPhotoUrl || undefined,
        verifications: [],
      };

      addDirectReport(contextPollutionReport);
      setSelectedReportId(savedDoc.id);

      setSubmittedReport(savedDoc);
    } catch (err: unknown) {
      console.error('Error submitting coastal report:', err);
      const msg = err instanceof Error ? err.message : 'Failed to submit report. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    handleRemovePhoto();
    setDescription('');
    setPollutionType('Plastic');
    setSeverity('MODERATE');
    setSubmittedReport(null);
    setSubmitError(null);
    requestGeolocation();
  };

  const handleViewReport = () => {
    if (submittedReport) {
      setSelectedReportId(submittedReport.id);
    }
    onNavigate('/dashboard');
  };

  // SUCCESS SCREEN (Displayed after successful submission)
  if (submittedReport) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 text-center space-y-5">
          {/* Animated checkmark indicator */}
          <div className="w-16 h-16 rounded-full bg-teal-50 border-4 border-teal-100 flex items-center justify-center mx-auto text-teal-600 shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pollution report submitted successfully.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Your report has been securely registered in Cloud Firestore and queued for ground-truth volunteer verification along the Visakhapatnam shoreline.
            </p>
          </div>

          {/* Submission Summary Ticket Card */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 text-left space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Report ID
                </span>
                <span className="font-mono text-base font-bold text-teal-800">
                  {submittedReport.reportNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Status
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
                  {submittedReport.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  Pollution Type
                </span>
                <span className="font-semibold text-slate-900">{submittedReport.pollutionType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  Severity
                </span>
                <span className="font-semibold text-slate-900">{submittedReport.severity}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-0.5">
                Location
              </span>
              <div className="flex items-center gap-1.5 font-mono text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  {submittedReport.latitude.toFixed(5)}&deg; N, {submittedReport.longitude.toFixed(5)}&deg; E
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{coastalZone}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-0.5">
                Date / Time
              </span>
              <span className="font-mono text-slate-700 text-[11px]">
                {new Date(submittedReport.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                })}
              </span>
            </div>

            {submittedReport.photoUrl && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                  Attached Evidence
                </span>
                <img
                  src={submittedReport.photoUrl}
                  alt="Pollution evidence preview"
                  className="w-full h-36 object-cover rounded-lg border border-slate-200 shadow-2xs"
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleViewReport}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>View Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetForm}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Submit Another Report</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN REPORTING FORM (Mobile-First)
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-mono font-semibold uppercase">
          <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
          <span>Visakhapatnam Shoreline Incident Intake</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Report Shoreline Pollution
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Capture photo evidence and GPS coordinates of coastal hazards. Every submission enters the accredited volunteer ground-truth verification queue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Error notification banner */}
        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Submission Error</span>
              <p className="mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* 1. PHOTO SECTION */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-mono font-bold">
                1
              </span>
              <span>Photo Evidence</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">JPG, PNG, WebP up to 10MB</span>
          </div>

          {/* Hidden native inputs for camera vs gallery */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {photoError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{photoError}</span>
            </div>
          )}

          {/* Photo Preview or Selection Triggers */}
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-950 group">
              <img
                src={photoPreview}
                alt="Pollution evidence preview"
                className="w-full h-56 sm:h-64 object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                <div className="text-white text-xs">
                  <span className="font-semibold block truncate max-w-[200px] sm:max-w-xs">
                    {photoFile?.name}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    {photoFile ? (photoFile.size / (1024 * 1024)).toFixed(2) + ' MB' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Camera Trigger */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/80 text-teal-950 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[110px]"
              >
                <div className="p-2.5 rounded-full bg-teal-600 text-white shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold block">Camera Capture</span>
                  <span className="text-[10px] text-teal-700">Take photo on mobile</span>
                </div>
              </button>

              {/* Gallery / File Picker */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[110px]"
              >
                <div className="p-2.5 rounded-full bg-slate-200 text-slate-700 shadow-xs">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold block">Choose from Gallery</span>
                  <span className="text-[10px] text-slate-500">Upload existing image</span>
                </div>
              </button>
            </div>
          )}
        </section>

        {/* 2. LOCATION & GPS SECTION */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-mono font-bold">
                2
              </span>
              <span>Shoreline Location</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">Leaflet / OpenStreetMap</span>
          </div>

          {/* GPS Status Banner */}
          {gpsStatus === 'detected' && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">Location detected</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700">
                {latitude.toFixed(4)}&deg; N, {longitude.toFixed(4)}&deg; E
              </span>
            </div>
          )}

          {gpsStatus === 'failed' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">Location unavailable — select your location manually.</span>
              </div>
              <button
                type="button"
                onClick={requestGeolocation}
                className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer shrink-0"
              >
                Retry GPS
              </button>
            </div>
          )}

          {/* Interactive Leaflet Map for Pin Adjustment */}
          <LocationPickerMap
            latitude={latitude}
            longitude={longitude}
            onChangeLocation={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
            gpsStatus={gpsStatus}
            onRequestGps={requestGeolocation}
          />

          <p className="text-[11px] text-slate-500 leading-tight">
            Tap or drag the map pin to adjust coordinates.
          </p>

          {/* Coastal Zone Preset Quick-Picks */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-700 block">
              Quick Presets (Visakhapatnam Shoreline):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SHORELINE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setLatitude(preset.lat);
                    setLongitude(preset.lng);
                    setCoastalZone(preset.name);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition-colors cursor-pointer ${
                    Math.abs(latitude - preset.lat) < 0.001 && Math.abs(longitude - preset.lng) < 0.001
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate manual input fields */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Latitude (&deg;N)
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Longitude (&deg;E)
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
                required
              />
            </div>
          </div>
        </section>

        {/* 3. POLLUTION TYPE SECTION */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-mono font-bold">
                3
              </span>
              <span>Pollution Type</span>
            </label>
            <span className="text-[11px] font-mono text-teal-700 font-bold">Selected: {pollutionType}</span>
          </div>

          {/* Mobile-Friendly Grid of Pollution Types */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POLLUTION_TYPES.map((type) => {
              const isSelected = pollutionType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPollutionType(type)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none text-xs flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-teal-600 text-teal-950 font-bold ring-1 ring-teal-600 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                  }`}
                >
                  <span className="truncate">{type}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. SEVERITY SECTION */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-mono font-bold">
                4
              </span>
              <span>Severity Level</span>
            </label>
            <span className="text-[11px] font-mono font-bold text-slate-600">{severity}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SEVERITY_LEVELS.map((lvl) => {
              const isSelected = severity === lvl.key;
              return (
                <button
                  key={lvl.key}
                  type="button"
                  onClick={() => setSeverity(lvl.key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer select-none text-xs flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? `ring-2 ${lvl.ringClass} shadow-xs`
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${lvl.badgeClass}`}>
                      {lvl.label}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{lvl.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. DESCRIPTION SECTION */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-mono font-bold">
                5
              </span>
              <span>Description</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">{description.length} characters</span>
          </div>

          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the hazard details: approximate area/length, tide reach, specific odors, nearby landmarks, or visible drain sources..."
            className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-600 focus:outline-hidden leading-relaxed resize-y"
          />

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Include any observed marine impact (e.g. ghost net entangled on tetrapods, plastic bottles choking storm outfall).
          </p>
        </section>

        {/* SUBMIT BUTTON (High-Contrast, Touch-Friendly) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-black text-sm tracking-wider uppercase shadow-lg hover:shadow-teal-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-98"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading Evidence &amp; Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Pollution Report</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-500 mt-2.5">
            Initial ticket status will be registered as <strong className="text-slate-700">REPORTED</strong> with a unique tracking code (BS-2026-XXXX).
          </p>
        </div>

      </form>
    </div>
  );
};
