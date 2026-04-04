from config import db
from datetime import datetime

# class User(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     username = db.Column(db.String(80), unique=True, nullable=False)
#     email = db.Column(db.String(120), unique=True, nullable=False)

#     def __repr__(self):
#         return f'<User {self.username}>'


class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    set1 = db.Column(db.Integer)
    set2 = db.Column(db.Integer)
    set3 = db.Column(db.Integer)

class WorkoutLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercise.id'))
    date = db.Column(db.Date, default=datetime.today)
    set1 = db.Column(db.Integer)
    set2 = db.Column(db.Integer)
    set3 = db.Column(db.Integer)
    duration = db.Column(db.Integer)  # seconds

# class sets(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     exercise_id = db.Column(db.Integer, db.ForeignKey('Exercise.id'), nullable=False)
#     set1 = db.Column(db.Integer, unique=False, nullable=True)
#     set2 = db.Column(db.Integer, unique=False, nullable=True)
#     set3 = db.Column(db.Integer, unique=False, nullable=True)

#     def __repr__(self):
#         return f'<sets {self.exercise}>'



# class workout(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     workout_name = db.Column(db.String(80), unique=True, nullable=False)
#     start_time = db.Column(db.DateTime)
#     end_time = db.Column(db.DateTime)


#     def __repr__(self):
#         return f'<workout {self.workout_name}>'
    


# class SetLog(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer)
#     exercise_name = db.Column(db.String)
#     reps = db.Column(db.Integer)
#     duration = db.Column(db.Integer)
#     created_at = db.Column(db.DateTime)

#     def __to_json__(self):
#         return {
#             'id': self.id,
#             'user_id': self.user_id,
#             'exercise_name': self.exercise_name,
#             'reps': self.reps,
#             'duration': self.duration,
#             'created_at': self.created_at.isoformat()
#         }