import React, { useState, useMemo } from 'react';
import {
  X,
  GitFork,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Calendar,
  Tag,
  ChevronRight,
  Info,
  Award,
  Sparkles
} from 'lucide-react';
import { GoatRecord } from '../types';

export interface PedigreeSubject {
  tag_number: string;
  name?: string;
  breed?: string;
  gender?: string;
  dob?: string;
  dam_tag?: string;
  sire_tag?: string;
  status?: string;
}

interface PedigreeTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootSubject: PedigreeSubject | null;
  allGoats: GoatRecord[];
}

export const PedigreeTreeModal: React.FC<PedigreeTreeModalProps> = ({
  isOpen,
  onClose,
  rootSubject,
  allGoats,
}) => {
  const [activeSubject, setActiveSubject] = useState<PedigreeSubject | null>(rootSubject);

  // Sync state when root subject changes
  React.useEffect(() => {
    setActiveSubject(rootSubject);
  }, [rootSubject]);

  // Lookup map for fast goat retrieval by tag or ID
  const goatMap = useMemo(() => {
    const map = new Map<string, GoatRecord>();
    allGoats.forEach(g => {
      if (g.tag_number) map.set(g.tag_number.trim().toUpperCase(), g);
      if (g.id) map.set(g.id.trim().toUpperCase(), g);
    });
    return map;
  }, [allGoats]);

  const findAncestor = (tag?: string): GoatRecord | null => {
    if (!tag || !tag.trim()) return null;
    return goatMap.get(tag.trim().toUpperCase()) || null;
  };

  // 3-Generation Lineage Nodes
  const lineage = useMemo(() => {
    if (!activeSubject) return null;

    // Generation 2: Parents
    const sireTag = activeSubject.sire_tag;
    const damTag = activeSubject.dam_tag;
    const sireRecord = findAncestor(sireTag);
    const damRecord = findAncestor(damTag);

    // Generation 3: Paternal Grandparents
    const paternalGrandSireTag = sireRecord?.sire_tag;
    const paternalGrandDamTag = sireRecord?.dam_tag;
    const paternalGrandSire = findAncestor(paternalGrandSireTag);
    const paternalGrandDam = findAncestor(paternalGrandDamTag);

    // Generation 3: Maternal Grandparents
    const maternalGrandSireTag = damRecord?.sire_tag;
    const maternalGrandDamTag = damRecord?.dam_tag;
    const maternalGrandSire = findAncestor(maternalGrandSireTag);
    const maternalGrandDam = findAncestor(maternalGrandDamTag);

    // Inbreeding Risk Calculation
    const paternalLineTags = [
      sireTag?.toUpperCase(),
      paternalGrandSireTag?.toUpperCase(),
      paternalGrandDamTag?.toUpperCase(),
    ].filter(Boolean) as string[];

    const maternalLineTags = [
      damTag?.toUpperCase(),
      maternalGrandSireTag?.toUpperCase(),
      maternalGrandDamTag?.toUpperCase(),
    ].filter(Boolean) as string[];

    const sharedAncestors = paternalLineTags.filter(tag => maternalLineTags.includes(tag));
    const isDirectParentOffspring =
      (sireTag && damTag && sireTag.toUpperCase() === damTag.toUpperCase()) ||
      (activeSubject.tag_number && (sireTag === activeSubject.tag_number || damTag === activeSubject.tag_number));

    const inbreedingRisk = isDirectParentOffspring || sharedAncestors.length > 0;

    return {
      root: activeSubject,
      sire: { tag: sireTag, record: sireRecord },
      dam: { tag: damTag, record: damRecord },
      paternalGrandSire: { tag: paternalGrandSireTag, record: paternalGrandSire },
      paternalGrandDam: { tag: paternalGrandDamTag, record: paternalGrandDam },
      maternalGrandSire: { tag: maternalGrandSireTag, record: maternalGrandSire },
      maternalGrandDam: { tag: maternalGrandDamTag, record: maternalGrandDam },
      inbreedingRisk,
      sharedAncestors: Array.from(new Set(sharedAncestors)),
      isDirectParentOffspring,
    };
  }, [activeSubject, goatMap]);

  if (!isOpen || !activeSubject || !lineage) return null;

  const renderNode = (
    title: string,
    roleColor: 'blue' | 'rose' | 'emerald',
    tag?: string,
    record?: GoatRecord | null,
    isRoot: boolean = false
  ) => {
    const isFound = Boolean(record);
    const displayName = record?.name || (tag ? `Tag: ${tag}` : 'Unknown / Unrecorded');
    const displayBreed = record?.breed || (isRoot ? activeSubject.breed : 'Breed Not Logged');
    const displayDob = record?.dob || (isRoot ? activeSubject.dob : undefined);

    const borderColors = {
      blue: 'border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 text-sky-900 dark:text-sky-200',
      rose: 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200',
      emerald: 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
    };

    const badgeColors = {
      blue: 'bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-300',
      rose: 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300',
      emerald: 'bg-emerald-600 text-white',
    };

    return (
      <div
        className={`p-3.5 rounded-2xl border ${borderColors[roleColor]} relative transition-all shadow-2xs ${
          isFound && !isRoot ? 'hover:border-emerald-500 hover:shadow-xs cursor-pointer' : ''
        }`}
        onClick={() => {
          if (record && !isRoot) {
            setActiveSubject(record);
          }
        }}
        title={isFound && !isRoot ? 'Click to inspect this ancestor as root' : undefined}
      >
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${badgeColors[roleColor]}`}>
            {title}
          </span>
          {isFound && !isRoot && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
              <span>View Tree</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>

        <div className="font-extrabold text-xs text-stone-900 dark:text-white truncate">
          {displayName}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-500 dark:text-stone-400 mt-1">
          {tag && (
            <span className="font-mono font-semibold text-stone-700 dark:text-stone-300">
              #{tag}
            </span>
          )}
          {displayBreed && (
            <span>• {displayBreed}</span>
          )}
          {displayDob && (
            <span>• Born: {displayDob}</span>
          )}
        </div>

        {!tag && (
          <div className="text-[10px] text-stone-400 dark:text-stone-500 italic mt-1">
            Lineage not registered in farm records
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-6 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-xs">
              <GitFork className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight">
                  Pedigree & Genealogical Lineage Tree
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  3 Generations
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Visualizes parental bloodlines, prevents accidental inbreeding, and validates pedigree integrity.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inbreeding Safety Audit Banner */}
        <div>
          {lineage.inbreedingRisk ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  ⚠️ Inbreeding Hazard Detected in Family Tree
                </h4>
                <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5 leading-relaxed">
                  {lineage.isDirectParentOffspring
                    ? 'Critical Alert: Direct parent-offspring or identical mating registered between Sire and Dam tags.'
                    : `Common ancestor(s) detected across both maternal and paternal lines: (${lineage.sharedAncestors.join(
                        ', '
                      )}). Avoid breeding this animal with related herd lines to eliminate recessive defects and inbreeding depression.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                  ✅ Clean Pedigree & Safe Lineage
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                  No common ancestral ear tags found between Sire and Dam bloodlines within 3 generations. Suitable for certified breeding programs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tree Container */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          
          {/* Generation 1: Subject Animal (Root) */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500 text-center">
              1. Selected Subject (Offspring)
            </div>
            <div className="max-w-md mx-auto">
              {renderNode(
                `Target ${activeSubject.gender || 'Goat'}`,
                'emerald',
                activeSubject.tag_number,
                null,
                true
              )}
            </div>
          </div>

          {/* Connector Down */}
          <div className="flex justify-center">
            <div className="w-px h-6 bg-stone-300 dark:bg-stone-700"></div>
          </div>

          {/* Generation 2: Parents (Sire & Dam) */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500 text-center">
              2. Parents (1st Degree Ancestors)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Paternal Side */}
              <div className="space-y-3 p-3 rounded-2xl bg-sky-50/30 dark:bg-sky-950/10 border border-sky-100 dark:border-sky-900/50">
                {renderNode(
                  'Sire (Father ♂)',
                  'blue',
                  lineage.sire.tag,
                  lineage.sire.record
                )}
                <div className="w-px h-4 bg-sky-200 dark:bg-sky-800 mx-auto"></div>
                {/* Generation 3: Paternal Grandparents */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {renderNode(
                    'Gr. Sire (♂)',
                    'blue',
                    lineage.paternalGrandSire.tag,
                    lineage.paternalGrandSire.record
                  )}
                  {renderNode(
                    'Gr. Dam (♀)',
                    'rose',
                    lineage.paternalGrandDam.tag,
                    lineage.paternalGrandDam.record
                  )}
                </div>
              </div>

              {/* Maternal Side */}
              <div className="space-y-3 p-3 rounded-2xl bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/50">
                {renderNode(
                  'Dam (Mother ♀)',
                  'rose',
                  lineage.dam.tag,
                  lineage.dam.record
                )}
                <div className="w-px h-4 bg-rose-200 dark:bg-rose-800 mx-auto"></div>
                {/* Generation 3: Maternal Grandparents */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {renderNode(
                    'Gr. Sire (♂)',
                    'blue',
                    lineage.maternalGrandSire.tag,
                    lineage.maternalGrandSire.record
                  )}
                  {renderNode(
                    'Gr. Dam (♀)',
                    'rose',
                    lineage.maternalGrandDam.tag,
                    lineage.maternalGrandDam.record
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Click any parent node with recorded data to pivot and inspect its genealogical lineage.</span>
          </div>

          <div className="flex items-center gap-2">
            {activeSubject !== rootSubject && (
              <button
                type="button"
                onClick={() => setActiveSubject(rootSubject)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
              >
                Reset to Original
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl font-bold transition-colors"
            >
              Close Lineage
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
