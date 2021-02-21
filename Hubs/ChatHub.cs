using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApplication1.EFModels;

namespace WebApplication1.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ElementsContext db;
        List<string> lockedList;

        public ChatHub(ElementsContext db) {
            this.db = db;
            lockedList = new List<string>();
        }

        private void updateDB(string name, string content) {
            var elem = db.Elements.First(el => el.Name == name);
            elem.Content = content;
            db.SaveChanges();
        }

        private void deletFromDB(string id) {
            var elem = db.Elements.First(el => el.Name == id);
            db.Elements.Remove(elem);
            db.SaveChanges();
        }

        private void addToDB(string name, string conntent,bool isNote) {
            var elem = new Elements { Name = name, Content = conntent,Type=isNote };
            db.Elements.Add(elem);
            db.SaveChanges();
        }

        public async Task changePosOfNote(string id,double x,double y,string html) {
            updateDB(id, html);

            await Clients.Others.SendAsync("changePosOfNote", id, x, y);
         }
        public async Task lockElem(string id)
        {
            lockedList.Add(id);
            await Clients.Others.SendAsync("addLock", id);
        }
        public async Task getLocked()
        {
            await Clients.Caller.SendAsync("setLocked",lockedList);
        }
        public async Task removeNote(string id)
        {
            deletFromDB(id);

            await Clients.Others.SendAsync("removeNote", id);
        }

        public async Task removeSVG(string id)
        {
            deletFromDB(id);

            await Clients.Others.SendAsync("removeSVG", id);
        }
        public async Task unlockElem(string id)
        {
            lockedList.Remove(id);
            await Clients.Others.SendAsync("unLock", id);
        }

        public async Task createFromSVG(string id,string svg)
        {
            addToDB(id, svg, false);
            await Clients.Others.SendAsync("createFromSVG", id, svg);

        }

        public async Task createNote(string id,string html) {
           
            try
            {
                addToDB(id, html,true);
                await Clients.Others.SendAsync("createNote", id, html);
            }
            catch (Exception e)
            {
                await Clients.Caller.SendAsync("error",e,html,id);
            }
            
        }

        public async Task changePos(string id, double x, double y,string svg)
        {
            updateDB(id, svg);

            await Clients.Others.SendAsync("changePos", id, x, y);

        }

        public async Task changeTextOfNote(string id, string text,string html)
        {
            updateDB(id, html);

            await Clients.Others.SendAsync("changeTextOfNote", id,text);

        }

        public async Task getSVG()
        {
            var svgs = db.Elements.Where(el => !el.Type);

            await Clients.Caller.SendAsync("setSVG", svgs);

        }
        public async Task getHTML()
        {
            var htmls = db.Elements.Where(el => el.Type);

            await Clients.Caller.SendAsync("setHTML", htmls);

        }
    }

}


