import { NursePublicProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MapPin, Star, CheckCircle2, Phone, UserCircle } from "lucide-react";

interface NurseCardProps {
  nurse: NursePublicProfile;
  onClick: (nurse: NursePublicProfile) => void;
  onViewProfile: (nurse: NursePublicProfile) => void;
  onConnect?: (nurse: NursePublicProfile) => void;
}

export function NurseCard({ nurse, onClick, onViewProfile, onConnect }: NurseCardProps) {
  return (
    <div
      onClick={() => onClick(nurse)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick(nurse)}
      className="w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer bg-white border-border/50 hover:border-primary/30 hover:bg-blue-50/40 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {nurse.avatarUrl ? (
            <img src={nurse.avatarUrl} alt={nurse.name} className="w-10 h-10 rounded-full object-cover border border-border/40" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {nurse.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
          )}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${nurse.isOnline ? "bg-emerald-500" : "bg-gray-400"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">{nurse.name}</p>
            <span className={`text-xs font-bold flex-shrink-0 ${nurse.isOnline ? "text-emerald-600" : "text-gray-400"}`}>
              {nurse.isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{nurse.specialization}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
              {nurse.rating > 0 ? (
                <><Star className="w-3 h-3 fill-current" />{nurse.rating.toFixed(1)}</>
              ) : (
                <span className="text-gray-400 font-medium">Baru</span>
              )}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />{nurse.distanceKm} km
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground flex-1 truncate">
          <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
          {nurse.strNumber}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="flex-shrink-0 h-7 px-2 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
          onClick={e => { e.stopPropagation(); onViewProfile(nurse); }}
        >
          <UserCircle className="w-3 h-3 mr-1" /> Profil
        </Button>
        <Button
          size="sm"
          className={`flex-shrink-0 h-7 px-2 text-xs ${nurse.isOnline ? "bg-primary hover:bg-primary/90 text-white shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          disabled={!nurse.isOnline}
          onClick={e => { e.stopPropagation(); if (nurse.isOnline && onConnect) onConnect(nurse); }}
        >
          <Phone className="w-3 h-3 mr-1" />
          {nurse.isOnline ? "Hubungkan" : "Offline"}
        </Button>
      </div>
    </div>
  );
}
