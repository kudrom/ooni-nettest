import urllib2
import json

if __name__ == "__main__":
    response = urllib2.urlopen('http://reports.ooni.nu:3000/reports?select=%22-_id%20probe_cc%20test_name%20start_time%22&limit=0&sort=%22start_time%22')
    json_string = response.read()
    reports = json.loads(json_string)
    # Currently sort in the REST API doesn't work
    reports.sort(key=lambda x: x['start_time'])
    with open('reports.json', 'w') as f:
        f.write('var reports = ')
        json.dump(reports, f)
