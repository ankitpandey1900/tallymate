import React from "react";
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Plane,
  MonitorSmartphone,
  Wifi,
  Zap,
  Coffee,
  Ticket,
  Music,
  Dumbbell,
  BookOpen,
  Film,
  Camera,
  Scissors,
  Baby,
  Dog,
  Gift,
  FileText,
  Tag
} from "lucide-react";

export function getCategoryIcon(name: string | undefined | null, size: number = 16) {
  if (!name) return <FileText size={size} />;
  
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("food") || lowerName.includes("dining") || lowerName.includes("restaurant") || lowerName.includes("lunch") || lowerName.includes("dinner") || lowerName.includes("meal") || lowerName.includes("snack") || lowerName.includes("eat")) return <Utensils size={size} />;
  if (lowerName.includes("coffee") || lowerName.includes("cafe")) return <Coffee size={size} />;
  if (lowerName.includes("transport") || lowerName.includes("travel") || lowerName.includes("car") || lowerName.includes("gas") || lowerName.includes("fuel") || lowerName.includes("taxi") || lowerName.includes("uber") || lowerName.includes("transit") || lowerName.includes("cab")) return <Car size={size} />;
  if (lowerName.includes("flight") || lowerName.includes("plane") || lowerName.includes("vacation") || lowerName.includes("holiday")) return <Plane size={size} />;
  if (lowerName.includes("home") || lowerName.includes("rent") || lowerName.includes("mortgage") || lowerName.includes("house") || lowerName.includes("accommodation")) return <Home size={size} />;
  if (lowerName.includes("shop") || lowerName.includes("clothing") || lowerName.includes("grocery") || lowerName.includes("groceries") || lowerName.includes("apparel") || lowerName.includes("buy")) return <ShoppingBag size={size} />;
  if (lowerName.includes("health") || lowerName.includes("medical") || lowerName.includes("doctor") || lowerName.includes("pharmacy") || lowerName.includes("medicine")) return <HeartPulse size={size} />;
  if (lowerName.includes("game") || lowerName.includes("entertainment") || lowerName.includes("hobby") || lowerName.includes("play")) return <Gamepad2 size={size} />;
  if (lowerName.includes("movie") || lowerName.includes("cinema") || lowerName.includes("film") || lowerName.includes("theater")) return <Film size={size} />;
  if (lowerName.includes("music") || lowerName.includes("spotify") || lowerName.includes("concert") || lowerName.includes("song")) return <Music size={size} />;
  if (lowerName.includes("ticket") || lowerName.includes("event") || lowerName.includes("show")) return <Ticket size={size} />;
  if (lowerName.includes("gym") || lowerName.includes("fitness") || lowerName.includes("workout") || lowerName.includes("sport")) return <Dumbbell size={size} />;
  if (lowerName.includes("education") || lowerName.includes("school") || lowerName.includes("college") || lowerName.includes("university") || lowerName.includes("course") || lowerName.includes("tuition")) return <GraduationCap size={size} />;
  if (lowerName.includes("book") || lowerName.includes("read")) return <BookOpen size={size} />;
  if (lowerName.includes("work") || lowerName.includes("office") || lowerName.includes("business") || lowerName.includes("job")) return <Briefcase size={size} />;
  if (lowerName.includes("tech") || lowerName.includes("electronic") || lowerName.includes("gadget") || lowerName.includes("phone") || lowerName.includes("app") || lowerName.includes("software") || lowerName.includes("computer")) return <MonitorSmartphone size={size} />;
  if (lowerName.includes("internet") || lowerName.includes("wifi") || lowerName.includes("broadband") || lowerName.includes("network")) return <Wifi size={size} />;
  if (lowerName.includes("electricity") || lowerName.includes("utility") || lowerName.includes("power") || lowerName.includes("water") || lowerName.includes("bill")) return <Zap size={size} />;
  if (lowerName.includes("hair") || lowerName.includes("salon") || lowerName.includes("beauty") || lowerName.includes("groom") || lowerName.includes("spa")) return <Scissors size={size} />;
  if (lowerName.includes("baby") || lowerName.includes("kid") || lowerName.includes("child") || lowerName.includes("toy")) return <Baby size={size} />;
  if (lowerName.includes("pet") || lowerName.includes("dog") || lowerName.includes("cat") || lowerName.includes("vet") || lowerName.includes("animal")) return <Dog size={size} />;
  if (lowerName.includes("gift") || lowerName.includes("present") || lowerName.includes("donation") || lowerName.includes("charity") || lowerName.includes("give")) return <Gift size={size} />;
  if (lowerName.includes("photo") || lowerName.includes("camera") || lowerName.includes("picture")) return <Camera size={size} />;
  
  // Default fallback if category doesn't match anything
  return <Tag size={size} />;
}
