using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace WebApplication1.Hubs
{
    public class ChatHub : Hub
    {

        public async Task changePosOfNote(string id,double x,double y) {
             await Clients.Others.SendAsync("changePosOfNote", id, x, y);

         }
        public async Task lockElem(string id)
        {
            await Clients.Others.SendAsync("addLock", id);
        }
        public async Task removeNote(string id)
        {
            await Clients.Others.SendAsync("removeNote", id);
        }

        public async Task removeSVG(string id)
        {
            await Clients.Others.SendAsync("removeSVG", id);
        }
        public async Task unlockElem(string id)
        {
            await Clients.Others.SendAsync("unLock", id);
        }

        public async Task createFromSVG(string id,string svg)
        {
            await Clients.Others.SendAsync("createFromSVG", id,svg);
        }

        public async Task createNote(string id,double x,double y,string text,double h,double w) {
            await Clients.Others.SendAsync("createNote", id, x, y, text, h, w);
        }

        public async Task changePos(string id, double x, double y)
        {
            await Clients.Others.SendAsync("changePos", id, x, y);

        }

        public async Task changeTextOfNote(string id, string text)
        {
            await Clients.Others.SendAsync("changeTextOfNote", id,text);

        }

        
    }

}


