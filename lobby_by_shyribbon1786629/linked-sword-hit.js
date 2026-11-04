/* Transcription of the public Linked Sword 125013769 SwordScript Blow path.
 * Roblox Instances, Humanoid, teams, Debris, and Touched are supplied by the
 * caller; browser contact generation is a separate, unverified approximation. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LinkedSwordHit=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function isTeamMate(a,b){return !!(a&&b&&!a.Neutral&&!b.Neutral&&a.TeamColor===b.TeamColor)}
 function blow(c){
  const hit=c.hit;if(!hit||!hit.Parent||!c.CheckIfAlive())return false;
  const arm=c.Character.FindFirstChild('Right Arm')||c.Character.FindFirstChild('RightHand');if(!arm)return false;
  const grip=arm.FindFirstChild('RightGrip');
  if(!grip||(grip.Part0!==arm&&grip.Part1!==arm)||(grip.Part0!==c.Handle&&grip.Part1!==c.Handle))return false;
  const character=hit.Parent,humanoid=character.FindFirstChild('Humanoid');if(!humanoid)return false;
  const player=c.Players.GetPlayerFromCharacter(character);if(player&&(player===c.Player||isTeamMate(c.Player,player)))return false;
  for(const value of humanoid.GetChildren())if(value.IsA('ObjectValue')&&value.Name==='creator')value.Destroy();
  const tag=c.Instance.new('ObjectValue');tag.Name='creator';tag.Value=c.Player;c.Debris.AddItem(tag,2);tag.SetParent(humanoid);
  humanoid.TakeDamage(c.Damage);return true;
 }
 return Object.freeze({isTeamMate,blow});
});
