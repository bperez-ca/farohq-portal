"use client";

import { Card } from "@/components/ui/card";
import { Star, MapPin, Phone, Globe, Clock } from "lucide-react";
import type { BusinessProfile } from "@/lib/types";

interface GooglePreviewCardProps {
  profile: BusinessProfile;
}

function getTodaysHours(profile: BusinessProfile): string {
  const days: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = days[new Date().getDay()];

  const todayHours = profile.hours.find((h) => h.day === today);

  if (!todayHours || !todayHours.open || !todayHours.close) {
    return "Closed today";
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${minutes !== "00" ? ":" + minutes : ""}${ampm}`;
  };

  return `Open today ${formatTime(todayHours.open)}–${formatTime(todayHours.close)}`;
}

export function GooglePreviewCard({ profile }: GooglePreviewCardProps) {
  const todaysHours = getTodaysHours(profile);
  const shortDescription = profile.description
    ? profile.description.slice(0, 150) + (profile.description.length > 150 ? "..." : "")
    : "";

  return (
    <Card className="p-6 rounded-xl shadow-sm sticky top-24">
      <div className="text-xs font-medium text-black/40 dark:text-white/40 mb-3">
        Google Preview
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{profile.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-sm font-medium">4.5</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < 4
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-300 dark:fill-gray-600 text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-black/60 dark:text-white/60 ml-1">
              (47)
            </span>
          </div>
          <div className="text-xs text-black/60 dark:text-white/60">
            {profile.category.primary}
          </div>
        </div>

        {profile.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-black/40 dark:text-white/40 flex-shrink-0 mt-0.5" />
            <div className="text-black/70 dark:text-white/70">
              {profile.address.street}
              {profile.address.unit && `, ${profile.address.unit}`}
              <br />
              {profile.address.city}, {profile.address.region} {profile.address.postal}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-black/40 dark:text-white/40 flex-shrink-0" />
          <a
            href={`tel:${profile.phones.primary}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {profile.phones.primary}
          </a>
        </div>

        {profile.website && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-black/40 dark:text-white/40 flex-shrink-0" />
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline truncate"
            >
              {profile.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-black/40 dark:text-white/40 flex-shrink-0" />
          <span className="text-black/70 dark:text-white/70">{todaysHours}</span>
        </div>

        {shortDescription && (
          <p className="text-sm text-black/70 dark:text-white/70 pt-2 border-t border-black/5 dark:border-white/10">
            {shortDescription}
          </p>
        )}

        {profile.listingsHealthIndex !== undefined && (
          <div className="pt-4 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-black/60 dark:text-white/60">Listings Health</span>
              <span className="font-medium">{profile.listingsHealthIndex}%</span>
            </div>
            <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${profile.listingsHealthIndex}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
