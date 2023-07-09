export interface Match {
  match_id: string;
  timestamp: string;
  team: string;
  opponent: string;
  event_type: string;
  event_details: EventDetails;
}

export interface EventDetails {
  player: Player;
  goal_type: string;
  minute: number;
  assist?: Player;
  video_url?: string;
}

export interface Player {
  name: string;
  position: string;
  number: number;
}