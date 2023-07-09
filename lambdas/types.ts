export interface Match {
  match_id: string;
  timestamptmp: string;
  team: string;
  opponent: string;
  event_type: string;
  event_details: EventDetails;
}

export interface EventDetails {
  player: Player;
  goal_type: string;
  goalMinute: number;
  assist?: Player;
  video_url?: string;
}

export interface Player {
  playerName: string;
  playerPosition: string;
  playerNumber: number;
}

export interface Statistic {
  [key:string]: any 
}