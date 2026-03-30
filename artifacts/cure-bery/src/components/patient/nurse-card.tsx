import { NursePublicProfile } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Activity, CheckCircle2, Phone, UserCircle } from "lucide-react";
import { motion } from "framer-motion";

interface NurseCardProps {
  nurse: NursePublicProfile;
  onClick: (nurse: NursePublicProfile) => void;
  onViewProfile: (nurse: NursePublicProfile) => void;
}

export function NurseCard({ nurse, onClick, onViewProfile }: NurseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="p-4 cursor-pointer hover:shadow-lg transition-all border-border/50 hover:border-primary/30"
        onClick={() => onClick(nurse)}
      >
        <div className="flex gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              <AvatarImage src={nurse.avatarUrl} alt={nurse.name} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {nurse.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            {nurse.isOnline && (
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h4 className="font-bold text-foreground font-display text-lg leading-tight truncate">
                  {nurse.name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="truncate">{nurse.specialization}</span>
                </div>
              </div>
              <Badge variant={nurse.isOnline ? "default" : "secondary"} className={nurse.isOnline ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                {nurse.isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 mt-3 text-sm">
              <div className="flex items-center gap-1 font-medium text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span>{nurse.rating.toFixed(1)}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{nurse.distanceKm} km</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="truncate">{nurse.strNumber}</span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile(nurse);
              }}
            >
              <UserCircle className="w-4 h-4 mr-1.5" />
              Profil
            </Button>
            <Button 
              size="sm" 
              variant={nurse.isOnline ? "default" : "outline"}
              className={nurse.isOnline ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20" : ""}
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-4 h-4 mr-1.5" />
              Hubungkan
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
