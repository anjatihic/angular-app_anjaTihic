import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { BehaviorSubject, map } from 'rxjs';
import * as bcrypt from 'bcryptjs';
import { Route, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  DATABASE_URL = "https://angular-library-8b92a-default-rtdb.firebaseio.com/user.json"

  loggedInUserSub = new BehaviorSubject<User>(new User());
  isItLoggedInSub = new BehaviorSubject<boolean>(false);
  loggedUserRoleSub = new BehaviorSubject<string>('');

  constructor(private http: HttpClient, private router: Router) {
    if(localStorage.getItem('user')){
      this.isItLoggedInSub.next(true);
      this.loggedUserRoleSub.next(localStorage.getItem('userRole')!);
      this.findUserById(localStorage.getItem('user')!).subscribe( res => {
        this.loggedInUserSub.next(res);
      });
    }
   }

  createNewUser(
    fName: string, lName: string, username: string, email: string, pass: string
  ){

    const userData = this.fillAUserObject(fName, lName, username, email, pass);

    this.http.post(this.DATABASE_URL, userData)
      .subscribe(response => {
        console.log(response);
      }, error => {
        console.error(error.message);
      });
  }

  getAllUsers(){
    return this.http.get(this.DATABASE_URL)
      .pipe( map((res: any) => {
        const allUsers = [];
        for(let key in res){
          allUsers.push({...res[key], id: key});
        }
        return allUsers;
      }))
  }

  login(
    username: string, pass: string
  ){
    return this.getAllUsers().pipe(map((res: User[]) => {
      const allUsers = res;
      let user = new User();
      for(let u of allUsers){
        if(u.username == username && bcrypt.compareSync(pass, u.pass)){
          user = u;
          break;
        }
      }
      this.loggedInUserSub.next(user);
      if(user.username != ''){
        this.isItLoggedInSub.next(true);
        this.loggedUserRoleSub.next(user.role);
        localStorage.setItem('user', user.id!);
        localStorage.setItem('userRole', user.role);
        
      }
      return user;
    }))

  }

  logout(){
    this.loggedInUserSub.next(new User());
    this.isItLoggedInSub.next(false);
    this.loggedUserRoleSub.next('');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }

  private fillAUserObject(fName: string, lName: string, username: string, email: string, pass: string){
    let user = new User();

    user.fName = fName;
    user.lName = lName;
    user.username = username;
    user.email = email;
    user.pass = pass;

    return user;
  }

  private findUserById(id: string){
    return this.getAllUsers().pipe(map((res: User[]) => {
      const allUsers = res;
      let user = new User();
      for(let u of allUsers){
        if(u.id == id){
          user = u;
          break;
        }
      }
      this.loggedInUserSub.next(user);
      return user;
    }))
  }
}
